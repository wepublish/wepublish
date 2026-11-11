import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DragonflyConnection } from '@wepublish/dragonfly/api';
import { randomBytes } from 'crypto';
import { CatchUpScheduler, REPLICAS_CAUGHT_UP_MS } from './catch-up-scheduler';

export const VERSION_REFRESH_MS = 2000;

const RESYNC_INTERVAL_MS = 5000;

const newVersion = () =>
  `${Date.now().toString(36)}${randomBytes(4).toString('hex')}`;

type KnownVersion = { version: string; checkedAt: number };

type UnsyncedVersion = { version: string; ttlMs?: number };

@Injectable()
export class NamespaceVersions implements OnModuleDestroy {
  private inFlight = new Map<string, Promise<string>>();
  private knownVersions = new Map<string, KnownVersion>();
  private unsyncedVersions = new Map<string, UnsyncedVersion>();
  private versionWrites = new Map<string, number>();
  private resyncTimer?: ReturnType<typeof setInterval>;
  private resyncing?: Promise<void>;

  constructor(
    private readonly connection: DragonflyConnection,
    private readonly catchUp: CatchUpScheduler
  ) {}

  async currentMany(namespaces: readonly string[]): Promise<string[]> {
    const now = Date.now();
    const stale = namespaces
      .map(namespace => this.versionKey(namespace))
      .filter(vk => {
        const known = this.knownVersions.get(vk);

        return (
          !(known && now - known.checkedAt < VERSION_REFRESH_MS) &&
          !this.inFlight.has(vk) &&
          !this.unsyncedVersions.has(vk)
        );
      });

    if (stale.length > 1) {
      const replies = this.connection
        .mget(stale)
        .then(reply => (reply.ok ? reply.value : stale.map(() => null)));

      stale.forEach((vk, index) => {
        const writes = this.versionWrites.get(vk);
        const p = replies
          .then(async shared => {
            const version =
              shared[index] ?? (await this.createSharedVersion(vk));

            return this.rememberVersion(vk, version, writes);
          })
          .finally(() => this.settle(vk));

        this.inFlight.set(vk, p);
      });
    }

    return Promise.all(namespaces.map(namespace => this.current(namespace)));
  }

  async current(namespace: string): Promise<string> {
    const vk = this.versionKey(namespace);
    const known = this.knownVersions.get(vk);

    if (known && Date.now() - known.checkedAt < VERSION_REFRESH_MS) {
      return known.version;
    }

    const existing = this.inFlight.get(vk);
    if (existing) {
      return existing;
    }

    const p = (async () => {
      const writes = this.versionWrites.get(vk);
      const unsynced = this.unsyncedVersions.get(vk)?.version;

      if (unsynced) {
        await this.resync();

        return this.rememberVersion(vk, unsynced, writes);
      }

      const shared =
        (await this.readShared(vk)) ?? (await this.createSharedVersion(vk));

      return this.rememberVersion(vk, shared, writes);
    })().finally(() => this.settle(vk));

    this.inFlight.set(vk, p);

    return p;
  }

  peekShared(namespace: string): Promise<string | undefined> {
    return this.readShared(this.versionKey(namespace));
  }

  async bump(name: string, { ttlMs }: { ttlMs?: number } = {}): Promise<void> {
    await this.writeVersion(this.versionKey(name), ttlMs);
  }

  onModuleDestroy() {
    clearInterval(this.resyncTimer);
    this.resyncTimer = undefined;
  }

  private settle(vk: string) {
    this.inFlight.delete(vk);
    this.versionWrites.delete(vk);
  }

  private versionKey(namespace: string): string {
    return `nsv:${namespace}`;
  }

  private async readShared(vk: string): Promise<string | undefined> {
    const reply = await this.connection.get(vk);

    return reply.ok ? (reply.value ?? undefined) : undefined;
  }

  private async writeShared(
    vk: string,
    version: string,
    ttlMs?: number
  ): Promise<boolean> {
    const reply = await this.connection.set(
      vk,
      version,
      ttlMs === undefined ? {} : { px: ttlMs }
    );

    return reply.ok && reply.value;
  }

  private rememberVersion(
    vk: string,
    version: string,
    writesBefore: number | undefined
  ): string {
    if (this.versionWrites.get(vk) !== writesBefore) {
      return (
        this.unsyncedVersions.get(vk)?.version ??
        this.knownVersions.get(vk)?.version ??
        version
      );
    }

    this.knownVersions.set(vk, { version, checkedAt: Date.now() });

    return version;
  }

  private async createSharedVersion(vk: string): Promise<string> {
    const version = this.knownVersions.get(vk)?.version ?? newVersion();
    await this.connection.set(vk, version, { nx: true });

    return (await this.readShared(vk)) ?? version;
  }

  private async writeVersion(vk: string, ttlMs?: number): Promise<void> {
    const version = newVersion();
    if (this.inFlight.has(vk)) {
      this.versionWrites.set(vk, (this.versionWrites.get(vk) ?? 0) + 1);
    }

    if (await this.writeShared(vk, version, ttlMs)) {
      this.unsyncedVersions.delete(vk);
    } else {
      this.unsyncedVersions.set(vk, { version, ttlMs });
      this.resyncTimer ??= setInterval(
        () => void this.resync(),
        RESYNC_INTERVAL_MS
      );
      this.resyncTimer.unref?.();
    }

    if (ttlMs === undefined) {
      this.knownVersions.set(vk, { version, checkedAt: Date.now() });
    }
  }

  private resync(): Promise<void> {
    this.resyncing ??= this.resyncUnsynced().finally(() => {
      this.resyncing = undefined;
    });

    return this.resyncing;
  }

  private async resyncUnsynced(): Promise<void> {
    const resynced: Array<[string, number | undefined]> = [];

    for (const vk of [...this.unsyncedVersions.keys()]) {
      const unsynced = this.unsyncedVersions.get(vk);

      if (!unsynced) {
        continue;
      }

      if (await this.writeShared(vk, unsynced.version, unsynced.ttlMs)) {
        if (this.unsyncedVersions.get(vk) === unsynced) {
          this.unsyncedVersions.delete(vk);
        }

        resynced.push([vk, unsynced.ttlMs]);
      }
    }

    if (!this.unsyncedVersions.size) {
      clearInterval(this.resyncTimer);
      this.resyncTimer = undefined;
    }

    if (resynced.length) {
      this.catchUp.after(REPLICAS_CAUGHT_UP_MS, () =>
        Promise.all(resynced.map(([vk, ttlMs]) => this.writeVersion(vk, ttlMs)))
      );
    }
  }
}
