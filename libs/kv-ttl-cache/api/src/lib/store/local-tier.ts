import { LruMap } from '../kv-ttl-cache-lru-map';
import { type CacheProfile } from './cache-profile';

type LocalEntry = { text: string; expiresAt: number };

const LOCAL_MAX_ENTRIES = 50000;
const LOCAL_MAX_CHARS = 32 * 1024 * 1024;

export class LocalTier {
  private entries: LruMap<string, LocalEntry>;
  private profiles = new Set<string>();
  private sharedKeys = new Set<string>();

  constructor(maxEntries = LOCAL_MAX_ENTRIES, maxChars = LOCAL_MAX_CHARS) {
    this.entries = new LruMap<string, LocalEntry>(
      maxEntries,
      maxChars,
      (key, entry) => key.length + entry.text.length
    );
  }

  register(profile: CacheProfile): void {
    if (this.profiles.has(profile.name)) {
      throw new Error(`The cache profile ${profile.name} is registered twice`);
    }

    if (profile.shared) {
      const sharedKeys = `${profile.scope ?? 'release'}\u0000${
        profile.keyPrefix
      }`;

      if (this.sharedKeys.has(sharedKeys)) {
        throw new Error(
          `The cache profile ${profile.name} shares the key prefix ${profile.keyPrefix} with another profile`
        );
      }

      this.sharedKeys.add(sharedKeys);
    }

    this.profiles.add(profile.name);
  }

  get(key: string): string | undefined {
    const entry = this.entries.get(key);

    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);

      return undefined;
    }

    return entry.text;
  }

  set(key: string, text: string, ttlMs: number): void {
    if (!(ttlMs > 0)) {
      this.entries.delete(key);

      return;
    }

    this.entries.set(key, { text, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.entries.delete(key);
  }
}
