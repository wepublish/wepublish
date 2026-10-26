import { Keyv } from 'keyv';

export const LINK_TTL = 3 * 24 * 60 * 60 * 1000;

export const MISSING_LINK_TTL = 4 * 60 * 60 * 1000;

export const MAX_LINKS = 50_000;

export class BoundedMemoryStore<T = unknown> extends Map<string, T> {
  constructor(private readonly maxEntries: number) {
    super();
  }

  override set(key: string, value: T): this {
    this.delete(key);
    super.set(key, value);

    while (this.size > this.maxEntries) {
      this.delete(this.keys().next().value as string);
    }

    return this;
  }
}

export const createLinkCacheOptions = (
  store = new BoundedMemoryStore(MAX_LINKS)
) => ({
  ttl: LINK_TTL,
  stores: [new Keyv({ store })],
});
