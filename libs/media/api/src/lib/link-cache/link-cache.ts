import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { createHash, randomBytes } from 'crypto';
import type { ImageURIObject } from '../media-service/media.service';

export const LINK_TTL = 3 * 24 * 60 * 60 * 1000;

export const MISSING_LINK_TTL = 4 * 60 * 60 * 1000;

export const REJECTED_VARIANT_TTL = 60 * 60 * 1000;

export const GENERATION_CHECK_MS = 2_000;

export const MEDIA_LINKS_CACHE = Symbol('MEDIA_LINKS_CACHE');

export const MEDIA_MISSING_LINKS_CACHE = Symbol('MEDIA_MISSING_LINKS_CACHE');

export const MEDIA_REJECTED_VARIANTS_CACHE = Symbol(
  'MEDIA_REJECTED_VARIANTS_CACHE'
);

export const MEDIA_GENERATIONS_CACHE = Symbol('MEDIA_GENERATIONS_CACHE');

export const MEDIA_GENERATION_CHECKS_CACHE = Symbol(
  'MEDIA_GENERATION_CHECKS_CACHE'
);

const FIRST_GENERATION = '0';

const hashKey = (key: string) => createHash('sha256').update(key).digest('hex');

@Injectable()
export class LinkCache {
  constructor(
    @Inject(MEDIA_LINKS_CACHE) private readonly links: Cache,
    @Inject(MEDIA_MISSING_LINKS_CACHE) private readonly missing: Cache,
    @Inject(MEDIA_REJECTED_VARIANTS_CACHE) private readonly rejected: Cache,
    @Inject(MEDIA_GENERATIONS_CACHE) private readonly generations: Cache,
    @Inject(MEDIA_GENERATION_CHECKS_CACHE)
    private readonly generationChecks: Cache
  ) {}

  async get(id: string, variant: string): Promise<ImageURIObject | undefined> {
    const key = await this.key(id, variant);

    return (
      (await this.missing.get<ImageURIObject>(key)) ??
      (await this.links.get<ImageURIObject>(key)) ??
      undefined
    );
  }

  async set(
    id: string,
    variant: string,
    value: ImageURIObject,
    ttl = LINK_TTL
  ) {
    const key = await this.key(id, variant);

    if (!value.exists) {
      await this.missing.set(key, value, ttl);
      return;
    }

    await this.missing.del(key);
    await this.links.set(key, value, ttl);
  }

  async rejection(id: string, variant: string): Promise<string | undefined> {
    return (
      (await this.rejected.get<string>(await this.key(id, variant))) ??
      undefined
    );
  }

  async reject(id: string, variant: string, message: string) {
    await this.rejected.set(
      await this.key(id, variant),
      message,
      REJECTED_VARIANT_TTL
    );
  }

  async forget(id: string) {
    const generation = randomBytes(8).toString('hex');

    await this.generations.set(hashKey(id), generation, LINK_TTL);
    await this.generationChecks.set(
      hashKey(id),
      generation,
      GENERATION_CHECK_MS
    );
  }

  private async key(id: string, variant: string) {
    return hashKey(JSON.stringify([id, await this.generation(id), variant]));
  }

  private async generation(id: string) {
    const key = hashKey(id);
    const checked = await this.generationChecks.get<string>(key);

    if (checked !== undefined && checked !== null) {
      return checked;
    }

    const generation =
      (await this.generations.get<string>(key)) ?? FIRST_GENERATION;
    await this.generationChecks.set(key, generation, GENERATION_CHECK_MS);

    return generation;
  }
}
