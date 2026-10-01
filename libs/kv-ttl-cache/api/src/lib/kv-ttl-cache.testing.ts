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

  override async setIfAbsent(key: string, value: string, ttlMs?: number) {
    this.written.push([key, value]);

    return super.setIfAbsent(key, value, ttlMs);
  }

  override async setRaw(key: string, value: string, ttlMs?: number) {
    this.written.push([key, value]);

    return super.setRaw(key, value, ttlMs);
  }
}
