import { Logger } from '@nestjs/common';
import { KvAtomicStore } from './kv-ttl-cache-atomic-store';

const logger = new Logger('KvTtlCache');

export class KvLock {
  private renewing: ReturnType<typeof setInterval>;
  private lostToAnother = false;

  constructor(
    private atomic: KvAtomicStore,
    private key: string,
    private token: string,
    private ttlMs: number
  ) {
    this.renewing = setInterval(() => void this.renew(), ttlMs / 4);
    this.renewing.unref?.();
  }

  get lost() {
    return this.lostToAnother;
  }

  async release() {
    clearInterval(this.renewing);

    if ((await this.atomic.getRaw(this.key)) === this.token) {
      await this.atomic.delRaw(this.key);
    }
  }

  private async renew() {
    const holder = await this.atomic.getRaw(this.key);

    if (!this.atomic.isAvailable()) {
      return;
    }

    if (holder === this.token) {
      await this.atomic.expireRaw(this.key, this.ttlMs);

      return;
    }

    if (holder === undefined) {
      const retaken = await this.atomic.setIfAbsent(
        this.key,
        this.token,
        this.ttlMs
      );

      if (retaken || !this.atomic.isAvailable()) {
        return;
      }
    }

    this.lostToAnother = true;
    clearInterval(this.renewing);
    logger.error(`Lost ${this.key} to another replica`);
  }
}
