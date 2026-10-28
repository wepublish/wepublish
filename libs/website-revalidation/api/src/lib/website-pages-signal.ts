import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DragonflyConnection } from '@wepublish/dragonfly/api';
import { NamespaceVersions } from '@wepublish/kv-ttl-cache/api';
import { WEBSITE_PAGES_VERSION, websitePagesKey } from './website-keys';

export const PAGES_QUIET_MS = 4000;

const PAGES_CHANGE_INTERVAL_MS = 60_000;
const PAGES_LONGEST_WAIT_MS = 60_000;

@Injectable()
export class WebsitePagesSignal implements OnModuleDestroy {
  private pagesTimer?: ReturnType<typeof setTimeout>;
  private pagesCheck?: Promise<void>;
  private unrecordedChange?: number;

  constructor(
    private readonly connection: DragonflyConnection,
    private readonly versions: NamespaceVersions
  ) {}

  async recordChange(): Promise<void> {
    if (!this.connection.shared) {
      return;
    }

    const now = Date.now();
    const recorded = await this.connection.set(
      websitePagesKey('nsl'),
      String(now)
    );
    await this.connection.set(websitePagesKey('nsf'), String(now), {
      nx: true,
    });

    if (!(recorded.ok && recorded.value)) {
      this.unrecordedChange = now;
    }

    clearTimeout(this.pagesTimer);
    this.pagesTimer = setTimeout(() => void this.checkDue(), PAGES_QUIET_MS);
    this.pagesTimer.unref?.();
  }

  checkDue(): Promise<void> {
    if (!this.connection.shared) {
      return Promise.resolve();
    }

    this.pagesCheck ??= this.changeIfDue().finally(() => {
      this.pagesCheck = undefined;
    });

    return this.pagesCheck;
  }

  onModuleDestroy() {
    clearTimeout(this.pagesTimer);
    this.pagesTimer = undefined;
  }

  private async read(kind: 'nsl' | 'nsf' | 'nsd'): Promise<string | undefined> {
    const reply = await this.connection.get(websitePagesKey(kind));

    return reply.ok ? (reply.value ?? undefined) : undefined;
  }

  private async changeIfDue(): Promise<void> {
    const now = Date.now();

    if (
      this.unrecordedChange !== undefined &&
      now - this.unrecordedChange >= PAGES_QUIET_MS
    ) {
      this.unrecordedChange = undefined;
      await this.versions.bump(WEBSITE_PAGES_VERSION);

      return;
    }

    const last = Number(await this.read('nsl'));
    const done = Number((await this.read('nsd')) ?? 0);

    if (!last || last <= done) {
      return;
    }

    const first = Number(await this.read('nsf')) || last;
    const quiet = now - last >= PAGES_QUIET_MS;

    if (!quiet && now - first < PAGES_LONGEST_WAIT_MS) {
      return;
    }

    const claimed = await this.connection.set(websitePagesKey('nsw'), '1', {
      nx: true,
      px: PAGES_CHANGE_INTERVAL_MS,
    });

    if (!(claimed.ok && claimed.value)) {
      return;
    }

    const covered = quiet ? last : now - PAGES_QUIET_MS;
    await this.connection.set(websitePagesKey('nsd'), String(covered));

    if (quiet) {
      await this.connection.del([websitePagesKey('nsf')]);
    } else {
      await this.connection.set(websitePagesKey('nsf'), String(covered + 1));
    }

    await this.versions.bump(WEBSITE_PAGES_VERSION);
  }
}
