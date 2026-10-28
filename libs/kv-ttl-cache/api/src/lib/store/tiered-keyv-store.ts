import { type DragonflyConnection } from '@wepublish/dragonfly/api';
import { Keyv, type KeyvStoreAdapter, type StoredData } from 'keyv';
import {
  DEFAULT_LOCAL_COPY_MS,
  UNSHARED_FALLBACK_TTL_MS,
} from '../kv-cache-timings';
import { type CacheProfile } from './cache-profile';
import { type KvCodec } from './kv-codec';
import { type LocalTier } from './local-tier';
import { type SharePolicy } from './share-policy';

export type TieredStoreEntry = { value: unknown; expires?: number };

type TieredKeyvStoreDeps = {
  local: LocalTier;
  connection: DragonflyConnection;
  codec: KvCodec;
  policy: SharePolicy;
  profile: CacheProfile;
  releaseId: string;
};

const refuseClear = (): never => {
  throw new Error(
    'TieredKeyvStore cannot clear; reset the namespace version instead'
  );
};

const NAMESPACED_KEY = /^ns:(.+?):v[0-9a-z]+(?:~\d+)?:/;

const isEnvelope = (decoded: unknown): decoded is TieredStoreEntry =>
  typeof decoded === 'object' &&
  decoded !== null &&
  'value' in decoded &&
  (!('expires' in decoded) || typeof decoded.expires === 'number');

export class TieredKeyvStore implements KeyvStoreAdapter {
  readonly opts = { dialect: 'wepublish-tiered' as const };
  namespace?: string;

  private local: LocalTier;
  private connection: DragonflyConnection;
  private codec: KvCodec;
  private policy: SharePolicy;
  private profile: CacheProfile;
  private sharedPrefix?: string;

  constructor({
    local,
    connection,
    codec,
    policy,
    profile,
    releaseId,
  }: TieredKeyvStoreDeps) {
    this.local = local;
    this.connection = connection;
    this.codec = codec;
    this.policy = policy;
    this.profile = profile;
    this.sharedPrefix =
      profile.shared ?
        `val:${profile.scope === 'global' ? '' : `${releaseId}:`}${
          profile.keyPrefix
        }`
      : undefined;
  }

  on(): this {
    return this;
  }

  async get<Value>(key: string): Promise<StoredData<Value> | undefined> {
    const local = this.readLocal(key);

    if (local) {
      return local as StoredData<Value>;
    }

    if (!this.sharesValues()) {
      return undefined;
    }

    const reply = await this.connection.get(this.sharedKey(key));

    if (!reply.ok || reply.value === null) {
      return undefined;
    }

    return this.acceptShared(key, reply.value) as StoredData<Value>;
  }

  async getMany<Value>(
    keys: string[]
  ): Promise<Array<StoredData<Value | undefined>>> {
    try {
      const found = keys.map(key => this.readLocal(key));
      const missing = keys.filter((_, index) => !found[index]);

      if (missing.length && this.sharesValues()) {
        const reply = await this.connection.mget(
          missing.map(key => this.sharedKey(key))
        );
        const texts = new Map(
          reply.ok ? missing.map((key, index) => [key, reply.value[index]]) : []
        );

        keys.forEach((key, index) => {
          const text = texts.get(key);

          if (!found[index] && typeof text === 'string') {
            found[index] = this.acceptShared(key, text);
          }
        });
      }

      return found as Array<StoredData<Value | undefined>>;
    } catch {
      return keys.map(() => undefined);
    }
  }

  async set(
    key: string,
    data: TieredStoreEntry,
    ttl?: number
  ): Promise<boolean> {
    if (ttl === undefined || data.value === null || data.value === undefined) {
      return false;
    }

    const text = this.codec.encode({
      value: data.value,
      expires: data.expires,
    });

    if (text === undefined) {
      return false;
    }

    if (!this.sharesValues()) {
      this.writeLocal(
        key,
        text,
        this.connection.outageSince() !== undefined ?
          Math.min(ttl, UNSHARED_FALLBACK_TTL_MS)
        : ttl
      );

      return true;
    }

    if (
      this.policy.check(
        this.label(key),
        data.value,
        text,
        () => this.codec.encode(data.value)?.length ?? text.length
      ) !== 'share'
    ) {
      this.writeLocal(key, text, ttl);

      return true;
    }

    if (!this.connection.isAvailable()) {
      this.writeLocal(key, text, Math.min(ttl, UNSHARED_FALLBACK_TTL_MS));

      return true;
    }

    const reply = await this.connection.set(this.sharedKey(key), text, {
      px: ttl,
    });

    this.writeLocal(
      key,
      text,
      reply.ok && reply.value ?
        Math.min(this.localCopyMs(), ttl)
      : Math.min(ttl, UNSHARED_FALLBACK_TTL_MS)
    );

    return true;
  }

  async delete(key: string): Promise<boolean> {
    return this.deleteMany([key]);
  }

  async deleteMany(keys: string[]): Promise<boolean> {
    keys.forEach(key => this.local.delete(this.localKey(key)));

    if (keys.length && this.sharesValues()) {
      await this.connection.del(keys.map(key => this.sharedKey(key)));
    }

    return true;
  }

  async clear(): Promise<void> {
    refuseClear();
  }

  async disconnect(): Promise<void> {
    return;
  }

  private sharesValues() {
    return this.sharedPrefix !== undefined && this.connection.shared;
  }

  private localCopyMs() {
    return this.profile.shared ?
        (this.profile.localCopyMs ?? DEFAULT_LOCAL_COPY_MS)
      : DEFAULT_LOCAL_COPY_MS;
  }

  private label(key: string) {
    return NAMESPACED_KEY.exec(key)?.[1] ?? this.profile.name;
  }

  private localKey(key: string) {
    return `${this.profile.name}:${key}`;
  }

  private sharedKey(key: string) {
    return `${this.sharedPrefix}${key}`;
  }

  private decode(text: string): TieredStoreEntry | undefined {
    const decoded = this.codec.decode<unknown>(text);

    return isEnvelope(decoded) ? decoded : undefined;
  }

  private readLocal(key: string): { value: unknown } | undefined {
    const localKey = this.localKey(key);
    const text = this.local.get(localKey);

    if (text === undefined) {
      return undefined;
    }

    const envelope = this.decode(text);

    if (!envelope) {
      this.local.delete(localKey);

      return undefined;
    }

    return { value: envelope.value };
  }

  private acceptShared(
    key: string,
    text: string
  ): { value: unknown } | undefined {
    const envelope = this.decode(text);
    const now = Date.now();

    if (!envelope || (envelope.expires ?? Infinity) <= now) {
      return undefined;
    }

    this.writeLocal(
      key,
      text,
      Math.min(this.localCopyMs(), (envelope.expires ?? Infinity) - now)
    );

    return { value: envelope.value };
  }

  private writeLocal(key: string, text: string, ttlMs: number) {
    this.local.set(this.localKey(key), text, ttlMs);
  }
}

export class TieredKeyv extends Keyv {
  constructor(store: TieredKeyvStore) {
    super({
      store,
      namespace: undefined,
      useKeyPrefix: false,
      serialize: undefined,
      deserialize: undefined,
    });
  }

  override async clear(): Promise<void> {
    refuseClear();
  }
}
