import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DragonflyConnection } from './dragonfly-connection';
import { claimLockKey, createLockToken, lockKey } from './lock-key';

export type ClaimResult =
  'claimed' | 'taken' | 'not-configured' | 'unavailable';

const CLAIM_RETRY_MS = 5000;

@Injectable()
export class DistributedClaims implements OnModuleDestroy {
  private waiting = new Map<ReturnType<typeof setTimeout>, () => void>();
  private destroyed = false;

  constructor(private readonly connection: DragonflyConnection) {}

  async claim(
    name: string,
    ttlMs: number,
    { retryForMs = 0 }: { retryForMs?: number } = {}
  ): Promise<ClaimResult> {
    if (!this.connection.shared) {
      return 'not-configured';
    }

    const retries = Math.floor(retryForMs / CLAIM_RETRY_MS);
    const token = createLockToken();

    for (let attempt = 0; ; attempt++) {
      const result = await claimLockKey(
        this.connection,
        lockKey(name),
        token,
        ttlMs
      );

      if (result !== 'unavailable' || attempt >= retries) {
        return result;
      }

      if (!(await this.waitToRetry())) {
        return 'unavailable';
      }
    }
  }

  onModuleDestroy() {
    this.destroyed = true;

    for (const [timer, stop] of this.waiting) {
      clearTimeout(timer);
      stop();
    }

    this.waiting.clear();
  }

  private waitToRetry() {
    return new Promise<boolean>(resolve => {
      if (this.destroyed) {
        resolve(false);

        return;
      }

      const timer = setTimeout(() => {
        this.waiting.delete(timer);
        resolve(true);
      }, CLAIM_RETRY_MS);
      timer.unref?.();
      this.waiting.set(timer, () => resolve(false));
    });
  }
}
