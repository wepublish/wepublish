import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  Optional,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { randomBytes } from 'crypto';
import { hostname } from 'os';
import {
  KV_ATOMIC_STORE,
  KvAtomicStore,
  MemoryAtomicStore,
} from './kv-ttl-cache-atomic-store';
import {
  deserializeCacheValue,
  serializeCacheValue,
} from './kv-ttl-cache-serializer';
import {
  WEBSITE_LAYOUT_NAMESPACE,
  WEBSITE_PAGES_NAMESPACE,
  findSecretField,
  isPageContentNamespace,
  isSharedNamespace,
  isWebsiteLayoutNamespace,
  websitePathNamespace,
} from './kv-ttl-cache-shared-namespaces';
import { traceCacheGet } from './kv-ttl-cache-tracing';

const VERSION_REFRESH_MS = 2000;
const RESYNC_INTERVAL_MS = 5000;
const REPLICAS_CAUGHT_UP_MS = 3000;
const MAX_SHARED_VALUE_CHARS = 256 * 1024;
const UNSHARED_FALLBACK_TTL_MS = 30_000;
const PAGES_QUIET_MS = 4000;
const PAGES_CHECK_MS = 5000;
const PAGES_CHANGE_INTERVAL_MS = 60_000;
const PAGES_LONGEST_WAIT_MS = 60_000;
const WEBSITE_REBUILD_AGAIN_MS = 6000;
const WEBSITE_PATH_TTL_MS = 4 * 60 * 60 * 1000;
const CLAIM_RETRY_MS = 5000;
const WEBSITE_HEARTBEAT_KEY = 'website:heartbeat';
const WEBSITE_HEARTBEAT_EVERY_MS = 20_000;
const WEBSITE_HEARTBEAT_TTL_MS = 60_000;
const RELEASE_CLAIM_MS = 30 * 24 * 60 * 60 * 1000;
export const HEALTH_PROBE_KEY = 'health';
export const HEALTH_PROBE_TTL_MS = 60_000;

const logger = new Logger('KvTtlCache');

const newVersion = () =>
  `${Date.now().toString(36)}${randomBytes(4).toString('hex')}`;

type KnownVersion = { version: string; checkedAt: number };

@Injectable()
export class KvTtlCacheService implements OnModuleDestroy {
  private inFlight = new Map<string, Promise<unknown>>();
  private nsVersionInFlight = new Map<string, Promise<string>>();
  private knownVersions = new Map<string, KnownVersion>();
  private unsyncedVersions = new Map<
    string,
    { version: string; ttlMs?: number }
  >();
  private release = process.env['APP_RELEASE_ID'] || 'dev';
  private resyncTimer?: ReturnType<typeof setInterval>;
  private pagesTimer?: ReturnType<typeof setTimeout>;
  private pagesWatch?: ReturnType<typeof setInterval>;
  private pagesCheck?: Promise<void>;
  private unrecordedPagesChange?: number;
  private reportedSecrets = new Set<string>();
  private lastHeartbeat = 0;

  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    @Optional()
    @Inject(KV_ATOMIC_STORE)
    private atomic: KvAtomicStore = new MemoryAtomicStore()
  ) {}

  private versionKey(namespace: string): string {
    return `nsv:${namespace}`;
  }

  private namespacedKey(
    namespace: string,
    version: string,
    key: string
  ): string {
    return `ns:${namespace}:v${version}:${key}`;
  }

  async getNamespaceVersions(namespaces: string[]): Promise<string[]> {
    const now = Date.now();
    const stale = namespaces
      .map(namespace => this.versionKey(namespace))
      .filter(vk => {
        const known = this.knownVersions.get(vk);

        return (
          !(known && now - known.checkedAt < VERSION_REFRESH_MS) &&
          !this.nsVersionInFlight.has(vk) &&
          !this.unsyncedVersions.has(vk)
        );
      });

    if (stale.length > 1) {
      const replies = this.atomic.getManyRaw(stale);

      stale.forEach((vk, index) => {
        const p = replies
          .then(async shared => {
            const version =
              shared[index] ??
              (await this.createSharedVersion(
                vk,
                this.knownVersions.get(vk)?.version
              ));

            this.knownVersions.set(vk, { version, checkedAt: Date.now() });

            return version;
          })
          .finally(() => this.nsVersionInFlight.delete(vk));

        this.nsVersionInFlight.set(vk, p);
      });
    }

    return Promise.all(
      namespaces.map(namespace => this.getNamespaceVersion(namespace))
    );
  }

  async getNamespaceVersion(namespace: string): Promise<string> {
    this.watchPagesChanges();
    const vk = this.versionKey(namespace);
    const known = this.knownVersions.get(vk);

    if (known && Date.now() - known.checkedAt < VERSION_REFRESH_MS) {
      return known.version;
    }

    const existing = this.nsVersionInFlight.get(vk);
    if (existing) {
      return existing;
    }

    const p = (async () => {
      const unsynced = this.unsyncedVersions.get(vk)?.version;

      if (unsynced) {
        await this.resyncVersions();

        this.knownVersions.set(vk, {
          version: unsynced,
          checkedAt: Date.now(),
        });

        return unsynced;
      }

      const shared =
        (await this.atomic.getRaw(vk)) ??
        (await this.createSharedVersion(vk, known?.version));

      this.knownVersions.set(vk, { version: shared, checkedAt: Date.now() });

      return shared;
    })().finally(() => this.nsVersionInFlight.delete(vk));

    this.nsVersionInFlight.set(vk, p);
    return p;
  }

  private async createSharedVersion(
    vk: string,
    localVersion: string | undefined
  ): Promise<string> {
    const version = localVersion ?? newVersion();
    await this.atomic.setIfAbsent(vk, version);

    return (await this.atomic.getRaw(vk)) ?? version;
  }

  onModuleDestroy() {
    clearInterval(this.resyncTimer);
    clearTimeout(this.pagesTimer);
    clearInterval(this.pagesWatch);
  }

  private async writeVersion(vk: string, ttlMs?: number): Promise<void> {
    const version = newVersion();

    if (await this.atomic.setRaw(vk, version, ttlMs)) {
      this.unsyncedVersions.delete(vk);
    } else {
      this.unsyncedVersions.set(vk, { version, ttlMs });
      this.resyncTimer ??= setInterval(
        () => void this.resyncVersions(),
        RESYNC_INTERVAL_MS
      );
      this.resyncTimer.unref?.();
    }

    if (ttlMs === undefined) {
      this.knownVersions.set(vk, { version, checkedAt: Date.now() });
    }
  }

  private async resyncVersions(): Promise<void> {
    const resynced: [string, number | undefined][] = [];

    for (const [vk, { version, ttlMs }] of [...this.unsyncedVersions]) {
      if (await this.atomic.setRaw(vk, version, ttlMs)) {
        this.unsyncedVersions.delete(vk);
        resynced.push([vk, ttlMs]);
      }
    }

    if (!this.unsyncedVersions.size) {
      clearInterval(this.resyncTimer);
      this.resyncTimer = undefined;
    }

    if (resynced.length) {
      setTimeout(() => {
        for (const [vk, ttlMs] of resynced) {
          void this.writeVersion(vk, ttlMs);
        }
      }, REPLICAS_CAUGHT_UP_MS).unref?.();
    }
  }

  async resetNamespace(
    namespace: string,
    { pages = true }: { pages?: boolean } = {}
  ): Promise<void> {
    const vk = this.versionKey(namespace);
    await this.writeVersion(vk);

    if (pages && isPageContentNamespace(namespace)) {
      await this.recordPagesChange();
    }

    if (pages && isWebsiteLayoutNamespace(namespace)) {
      await this.resetWebsiteLayout();
    }

    for (const k of this.inFlight.keys()) {
      if (k.startsWith(`ns:${namespace}:`)) {
        this.inFlight.delete(k);
      }
    }
  }

  async announceRelease(): Promise<void> {
    if (this.release === 'dev') {
      return;
    }

    if (await this.claim(`release:${this.release}`, RELEASE_CLAIM_MS)) {
      await this.recordPagesChange();
      await this.resetWebsiteLayout();
    }
  }

  async resetWebsitePaths(paths: string[]): Promise<void> {
    const write = () =>
      Promise.all(
        paths.map(path =>
          this.writeVersion(
            this.versionKey(websitePathNamespace(path)),
            WEBSITE_PATH_TTL_MS
          )
        )
      );

    await write();
    setTimeout(() => void write(), WEBSITE_REBUILD_AGAIN_MS).unref?.();
  }

  private async resetWebsiteLayout(): Promise<void> {
    const vk = this.versionKey(WEBSITE_LAYOUT_NAMESPACE);

    await this.writeVersion(vk);
    setTimeout(
      () => void this.writeVersion(vk),
      WEBSITE_REBUILD_AGAIN_MS
    ).unref?.();
  }

  private pagesKey(kind: 'nsl' | 'nsf' | 'nsd' | 'nsw') {
    return `${kind}:${WEBSITE_PAGES_NAMESPACE}`;
  }

  private watchPagesChanges() {
    if (this.pagesWatch) {
      return;
    }

    this.pagesWatch = setInterval(() => {
      void this.beatWebsiteHeartbeat();
      void this.checkPagesChange();
    }, PAGES_CHECK_MS);
    this.pagesWatch.unref?.();
    void this.beatWebsiteHeartbeat();
  }

  private async beatWebsiteHeartbeat(): Promise<void> {
    const now = Date.now();

    if (
      !this.atomic.shared ||
      now - this.lastHeartbeat < WEBSITE_HEARTBEAT_EVERY_MS
    ) {
      return;
    }

    if (
      await this.atomic.setRaw(
        WEBSITE_HEARTBEAT_KEY,
        String(now),
        WEBSITE_HEARTBEAT_TTL_MS
      )
    ) {
      this.lastHeartbeat = now;
    }
  }

  private async recordPagesChange(): Promise<void> {
    const now = Date.now();
    const recorded = await this.atomic.setRaw(
      this.pagesKey('nsl'),
      String(now)
    );
    await this.atomic.setIfAbsent(this.pagesKey('nsf'), String(now));

    if (!recorded) {
      this.unrecordedPagesChange = now;
    }

    this.watchPagesChanges();
    clearTimeout(this.pagesTimer);
    this.pagesTimer = setTimeout(
      () => void this.checkPagesChange(),
      PAGES_QUIET_MS
    );
    this.pagesTimer.unref?.();
  }

  private checkPagesChange(): Promise<void> {
    this.pagesCheck ??= this.changePagesIfDue().finally(() => {
      this.pagesCheck = undefined;
    });

    return this.pagesCheck;
  }

  private async changePagesIfDue(): Promise<void> {
    const now = Date.now();

    if (
      this.unrecordedPagesChange !== undefined &&
      now - this.unrecordedPagesChange >= PAGES_QUIET_MS
    ) {
      this.unrecordedPagesChange = undefined;
      await this.writeVersion(this.versionKey(WEBSITE_PAGES_NAMESPACE));

      return;
    }

    const last = Number(await this.atomic.getRaw(this.pagesKey('nsl')));
    const done = Number((await this.atomic.getRaw(this.pagesKey('nsd'))) ?? 0);

    if (!last || last <= done) {
      return;
    }

    const first =
      Number(await this.atomic.getRaw(this.pagesKey('nsf'))) || last;
    const quiet = now - last >= PAGES_QUIET_MS;

    if (!quiet && now - first < PAGES_LONGEST_WAIT_MS) {
      return;
    }

    const claimed = await this.atomic.setIfAbsent(
      this.pagesKey('nsw'),
      '1',
      PAGES_CHANGE_INTERVAL_MS
    );

    if (!claimed) {
      return;
    }

    const covered = quiet ? last : now - PAGES_QUIET_MS;
    await this.atomic.setRaw(this.pagesKey('nsd'), String(covered));

    if (quiet) {
      await this.atomic.delRaw(this.pagesKey('nsf'));
    } else {
      await this.atomic.setRaw(this.pagesKey('nsf'), String(covered + 1));
    }

    await this.writeVersion(this.versionKey(WEBSITE_PAGES_NAMESPACE));
  }

  async getOrLoad<T>(
    key: string,
    loader: () => Promise<T> | T,
    ttlSeconds: number,
    onMiss?: () => void
  ): Promise<T> {
    const cached = await this.cache.get<T>(key);
    if (cached !== undefined && cached !== null) {
      return cached;
    }

    onMiss?.();

    const existing = this.inFlight.get(key) as Promise<T> | undefined;
    if (existing) {
      return existing;
    }

    const load = async () => {
      const value = await Promise.resolve(loader());

      if (this.inFlight.get(key) === p) {
        await this.cache.set(key, value as any, ttlSeconds * 1000);
      }

      return value;
    };
    const p: Promise<T> = load().finally(() => {
      if (this.inFlight.get(key) === p) {
        this.inFlight.delete(key);
      }
    });

    this.inFlight.set(key, p as Promise<unknown>);

    return p;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.cache.set(
      key,
      value,
      ttlSeconds ? ttlSeconds * 1000 : undefined
    );
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get<T>(key);
  }

  async del(key: string): Promise<void> {
    await this.cache.del(key);
  }

  async getOrLoadNs<T>(
    namespace: string,
    key: string,
    loader: () => Promise<T> | T,
    ttlSeconds: number
  ): Promise<T> {
    return traceCacheGet(namespace, async () => {
      let hit = true;
      const value = await this.loadNs(
        namespace,
        key,
        loader,
        ttlSeconds,
        () => {
          hit = false;
        }
      );

      return { value, hit };
    });
  }

  private async loadNs<T>(
    namespace: string,
    key: string,
    loader: () => Promise<T> | T,
    ttlSeconds: number,
    onMiss: () => void
  ): Promise<T> {
    const version = await this.getNamespaceVersion(namespace);
    const fullKey = this.namespacedKey(namespace, version, key);

    if (!this.isShared(namespace)) {
      return this.getOrLoad(fullKey, loader, ttlSeconds, onMiss);
    }

    const cached = await this.readShared<T>(fullKey);
    if (cached !== undefined && cached !== null) {
      return cached;
    }

    onMiss();

    const existing = this.inFlight.get(fullKey) as Promise<T> | undefined;
    if (existing) {
      return existing;
    }

    const load = async () => {
      const value = await Promise.resolve(loader());

      if (this.inFlight.get(fullKey) === p) {
        await this.writeShared(namespace, fullKey, value, ttlSeconds);
      }

      return value;
    };
    const p: Promise<T> = load().finally(() => {
      if (this.inFlight.get(fullKey) === p) {
        this.inFlight.delete(fullKey);
      }
    });

    this.inFlight.set(fullKey, p as Promise<unknown>);

    return p;
  }

  async getOrLoadManyNs<T>(
    namespace: string,
    keys: string[],
    loader: (missing: string[]) => Promise<Array<T | null>>,
    ttlSeconds: number,
    keyPrefix = ''
  ): Promise<Array<T | null>> {
    return traceCacheGet(namespace, async () => {
      let misses = 0;
      const value = await this.loadManyNs(
        namespace,
        keys,
        missing => {
          misses = missing.length;

          return loader(missing);
        },
        ttlSeconds,
        keyPrefix
      );

      return { value, hit: misses === 0, keys: keys.length, misses };
    });
  }

  private async loadManyNs<T>(
    namespace: string,
    keys: string[],
    loader: (missing: string[]) => Promise<Array<T | null>>,
    ttlSeconds: number,
    keyPrefix: string
  ): Promise<Array<T | null>> {
    const version = await this.getNamespaceVersion(namespace);
    const cached = await this.getManyNs<T>(
      namespace,
      version,
      keys.map(key => `${keyPrefix}${key}`)
    );
    const missing = keys.filter(
      (_, index) => cached[index] === undefined || cached[index] === null
    );

    if (!missing.length) {
      return cached as T[];
    }

    const loaded = await loader(missing);
    const loadedByKey = new Map(
      missing.map((key, index) => [key, loaded[index] ?? null])
    );

    await Promise.all(
      [...loadedByKey].map(([key, value]) =>
        value === null ? undefined : (
          this.setAt(
            namespace,
            this.namespacedKey(namespace, version, `${keyPrefix}${key}`),
            value,
            ttlSeconds
          )
        )
      )
    );

    return keys.map(
      (key, index) => cached[index] ?? loadedByKey.get(key) ?? null
    );
  }

  private async getManyNs<T>(
    namespace: string,
    version: string,
    keys: string[]
  ): Promise<Array<T | undefined>> {
    const fullKeys = keys.map(key =>
      this.namespacedKey(namespace, version, key)
    );

    if (!this.isShared(namespace)) {
      return Promise.all(fullKeys.map(fullKey => this.get<T>(fullKey)));
    }

    const values = await Promise.all(
      fullKeys.map(fullKey => this.cache.get<T>(fullKey))
    );
    const remote = fullKeys.filter(
      (_, index) => values[index] === undefined || values[index] === null
    );

    if (!remote.length) {
      return values;
    }

    const texts = await this.atomic.getManyRaw(
      remote.map(fullKey => this.sharedKey(fullKey))
    );
    const remoteValues = new Map<string, T>();

    await Promise.all(
      remote.map(async (fullKey, index) => {
        const text = texts[index];

        if (text === undefined) {
          return;
        }

        const value = deserializeCacheValue<T>(text);
        remoteValues.set(fullKey, value);
        await this.cache.set(fullKey, value as any, VERSION_REFRESH_MS);
      })
    );

    return fullKeys.map(
      (fullKey, index) => values[index] ?? remoteValues.get(fullKey)
    );
  }

  async setNs<T>(
    namespace: string,
    key: string,
    value: T,
    ttlSeconds?: number
  ): Promise<void> {
    const version = await this.getNamespaceVersion(namespace);

    await this.setAt(
      namespace,
      this.namespacedKey(namespace, version, key),
      value,
      ttlSeconds
    );
  }

  private async setAt<T>(
    namespace: string,
    fullKey: string,
    value: T,
    ttlSeconds?: number
  ): Promise<void> {
    if (this.isShared(namespace) && ttlSeconds) {
      return this.writeShared(namespace, fullKey, value, ttlSeconds);
    }

    await this.set(fullKey, value, ttlSeconds);
  }

  async getNs<T>(namespace: string, key: string): Promise<T | undefined> {
    const version = await this.getNamespaceVersion(namespace);
    const fullKey = this.namespacedKey(namespace, version, key);

    if (this.isShared(namespace)) {
      return this.readShared<T>(fullKey);
    }

    return this.get<T>(fullKey);
  }

  async delNs(namespace: string, key: string): Promise<void> {
    const version = await this.getNamespaceVersion(namespace);
    const fullKey = this.namespacedKey(namespace, version, key);
    this.inFlight.delete(fullKey);
    await this.del(fullKey);

    if (!this.isShared(namespace)) {
      return;
    }

    const sharedKey = this.sharedKey(fullKey);
    await this.atomic.delRaw(sharedKey);

    setTimeout(() => {
      void this.atomic.delRaw(sharedKey);
      void this.del(fullKey);
    }, REPLICAS_CAUGHT_UP_MS).unref?.();
  }

  async dragonflyStatus(): Promise<
    'reachable' | 'unreachable' | 'not-configured'
  > {
    if (!this.atomic.shared) {
      return 'not-configured';
    }

    const written = await this.atomic.setRaw(
      HEALTH_PROBE_KEY,
      String(Date.now()),
      HEALTH_PROBE_TTL_MS
    );

    return written ? 'reachable' : 'unreachable';
  }

  async claim(
    name: string,
    ttlMs: number,
    { retryForMs = 0 }: { retryForMs?: number } = {}
  ): Promise<boolean | undefined> {
    const retries = Math.floor(retryForMs / CLAIM_RETRY_MS);

    for (let attempt = 0; ; attempt++) {
      const claimed = await this.claimOnce(name, ttlMs);

      if (claimed !== undefined || !this.atomic.shared || attempt >= retries) {
        return claimed;
      }

      await new Promise(resolve => setTimeout(resolve, CLAIM_RETRY_MS));
    }
  }

  async increment(name: string, ttlMs: number): Promise<number | undefined> {
    if (!this.atomic.shared || !this.atomic.isAvailable()) {
      return undefined;
    }

    const count = await this.atomic.incrementRaw(`count:${name}`, ttlMs);

    return this.atomic.isAvailable() ? count : undefined;
  }

  async count(name: string): Promise<number | undefined> {
    if (!this.atomic.shared || !this.atomic.isAvailable()) {
      return undefined;
    }

    const count = await this.atomic.getRaw(`count:${name}`);

    return this.atomic.isAvailable() ? Number(count ?? 0) : undefined;
  }

  async forgetCount(name: string): Promise<void> {
    if (this.atomic.shared) {
      await this.atomic.delRaw(`count:${name}`);
    }
  }

  private async claimOnce(
    name: string,
    ttlMs: number
  ): Promise<boolean | undefined> {
    if (!this.atomic.shared || !this.atomic.isAvailable()) {
      return undefined;
    }

    const claimed = await this.atomic.setIfAbsent(
      `lock:${name}`,
      hostname(),
      ttlMs
    );

    return this.atomic.isAvailable() ? claimed : undefined;
  }

  private isShared(namespace: string): boolean {
    return this.atomic.shared && isSharedNamespace(namespace);
  }

  private sharedKey(fullKey: string): string {
    return `val:${this.release}:${fullKey}`;
  }

  private async readShared<T>(fullKey: string): Promise<T | undefined> {
    const local = await this.cache.get<T>(fullKey);
    if (local !== undefined && local !== null) {
      return local;
    }

    const text = await this.atomic.getRaw(this.sharedKey(fullKey));
    if (text === undefined) {
      return undefined;
    }

    const value = deserializeCacheValue<T>(text);
    await this.cache.set(fullKey, value as any, VERSION_REFRESH_MS);

    return value;
  }

  private async writeShared<T>(
    namespace: string,
    fullKey: string,
    value: T,
    ttlSeconds: number
  ): Promise<void> {
    const ttlMs = ttlSeconds * 1000;
    const text = serializeCacheValue(value);
    const secret = findSecretField(value);

    if (secret && !this.reportedSecrets.has(namespace)) {
      this.reportedSecrets.add(namespace);
      logger.error(
        `Not storing ${namespace} in Dragonfly, it contains the field ${secret}`
      );
    }

    const shareable =
      !secret &&
      value !== null &&
      typeof text === 'string' &&
      text.length <= MAX_SHARED_VALUE_CHARS;
    const shared =
      shareable &&
      this.atomic.isAvailable() &&
      (await this.atomic.setRaw(this.sharedKey(fullKey), text, ttlMs));
    const localTtlMs =
      shared ? VERSION_REFRESH_MS
      : shareable ? UNSHARED_FALLBACK_TTL_MS
      : ttlMs;

    await this.cache.set(fullKey, value as any, Math.min(localTtlMs, ttlMs));
  }
}
