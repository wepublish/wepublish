import { MemoryAtomicStore } from './kv-ttl-cache-atomic-store';

export const INTEGRATION_NAMESPACES = [
  'settings:paymentprovider',
  'settings:mailprovider',
  'settings:challenge',
  'settings:tracking-pixel',
  'settings:ai',
  'settings:analyticsprovider',
  'settings:syncprovider',
];

export class FakeDragonfly extends MemoryAtomicStore {
  override readonly shared = true;
  written: Array<[string, string]> = [];
  down = false;

  override isAvailable() {
    return !this.down;
  }

  override async ping() {
    return !this.down;
  }

  override async setIfAbsent(key: string, value: string, ttlMs?: number) {
    if (this.down) {
      return true;
    }

    this.written.push([key, value]);

    return super.setIfAbsent(key, value, ttlMs);
  }

  override async getRaw(key: string) {
    return this.down ? undefined : super.getRaw(key);
  }

  override async getManyRaw(keys: string[]) {
    return this.down ? keys.map(() => undefined) : super.getManyRaw(keys);
  }

  override async incrementRaw(key: string, ttlMs: number) {
    return this.down ? undefined : super.incrementRaw(key, ttlMs);
  }

  override async delRaw(key: string) {
    if (!this.down) {
      await super.delRaw(key);
    }
  }

  override async setRaw(key: string, value: string, ttlMs?: number) {
    if (this.down) {
      return false;
    }

    this.written.push([key, value]);

    return super.setRaw(key, value, ttlMs);
  }
}
