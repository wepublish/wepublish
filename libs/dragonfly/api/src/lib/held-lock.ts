import { Logger } from '@nestjs/common';
import { DragonflyConnection } from './dragonfly-connection';

export interface HeldLock {
  readonly lost: boolean;
  release(): Promise<void>;
}

const logger = new Logger('Dragonfly');

export class RenewingLock implements HeldLock {
  private renewing: ReturnType<typeof setInterval>;
  private lostToAnother = false;

  constructor(
    private readonly connection: DragonflyConnection,
    private readonly key: string,
    private readonly token: string,
    private readonly ttlMs: number
  ) {
    this.renewing = setInterval(() => void this.renew(), ttlMs / 4);
    this.renewing.unref?.();
  }

  get lost() {
    return this.lostToAnother;
  }

  async release() {
    clearInterval(this.renewing);

    const holder = await this.connection.get(this.key);

    if (holder.ok && holder.value === this.token) {
      await this.connection.del([this.key]);
    }
  }

  private async renew() {
    if (!this.connection.isAvailable()) {
      return;
    }

    const holder = await this.connection.get(this.key);

    if (!holder.ok) {
      return;
    }

    if (holder.value === this.token) {
      await this.connection.pexpire(this.key, this.ttlMs);

      return;
    }

    if (holder.value === null) {
      const retaken = await this.connection.set(this.key, this.token, {
        px: this.ttlMs,
        nx: true,
      });

      if (!retaken.ok || retaken.value) {
        return;
      }
    }

    this.lostToAnother = true;
    clearInterval(this.renewing);
    logger.error(`Lost ${this.key} to another replica`);
  }
}
