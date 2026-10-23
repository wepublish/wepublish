import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  KvTtlCacheService,
  type KvTtlCacheConfig,
} from '@wepublish/kv-ttl-cache/api/core';
import type { ImageURIObject } from '../media-service/media.service';

export const LINK_TTL = 3 * 24 * 60 * 60 * 1000;

export const MISSING_LINK_TTL = 4 * 60 * 60 * 1000;

export const REJECTED_VARIANT_TTL = 60 * 60 * 1000;

const LINKS_NAMESPACE = 'media:links';

const MISSING_LINKS_NAMESPACE = 'media:missing-links';

const REJECTED_VARIANTS_NAMESPACE = 'media:rejected-variants';

export const LINK_CACHE_CONFIG: KvTtlCacheConfig = {
  sharedNamespaces: {
    [LINKS_NAMESPACE]: { localCopyMs: LINK_TTL, acrossReleases: true },
    [REJECTED_VARIANTS_NAMESPACE]: { localCopyMs: REJECTED_VARIANT_TTL },
  },
};

const hashKey = (key: string) => createHash('sha256').update(key).digest('hex');

const toSeconds = (ms: number) => Math.ceil(ms / 1000);

@Injectable()
export class LinkCache {
  constructor(private readonly kv: KvTtlCacheService) {}

  async get(key: string): Promise<ImageURIObject | undefined> {
    const id = hashKey(key);

    return (
      (await this.kv.getNs<ImageURIObject>(MISSING_LINKS_NAMESPACE, id)) ??
      (await this.kv.getNs<ImageURIObject>(LINKS_NAMESPACE, id))
    );
  }

  async set(key: string, value: ImageURIObject, ttl = LINK_TTL) {
    const id = hashKey(key);

    if (!value.exists) {
      await this.kv.setNs(MISSING_LINKS_NAMESPACE, id, value, toSeconds(ttl));
      return;
    }

    await this.kv.delNs(MISSING_LINKS_NAMESPACE, id);
    await this.kv.setNs(LINKS_NAMESPACE, id, value, toSeconds(ttl));
  }

  async rejection(key: string): Promise<string | undefined> {
    return await this.kv.getNs<string>(
      REJECTED_VARIANTS_NAMESPACE,
      hashKey(key)
    );
  }

  async reject(key: string, message: string) {
    await this.kv.setNs(
      REJECTED_VARIANTS_NAMESPACE,
      hashKey(key),
      message,
      toSeconds(REJECTED_VARIANT_TTL)
    );
  }
}
