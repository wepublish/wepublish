import { Injectable } from '@nestjs/common';
import { DragonflyConnection } from './dragonfly-connection';
import { type HeldLock, RenewingLock } from './held-lock';
import { claimLockKey, createLockToken, lockKey } from './lock-key';

export type LockResult =
  | { status: 'acquired'; lock: HeldLock }
  | { status: 'taken' | 'not-configured' | 'unavailable' };

@Injectable()
export class DistributedLocks {
  constructor(private readonly connection: DragonflyConnection) {}

  async acquire(name: string, ttlMs: number): Promise<LockResult> {
    if (!this.connection.shared) {
      return { status: 'not-configured' };
    }

    const key = lockKey(name);
    const token = createLockToken();
    const status = await claimLockKey(this.connection, key, token, ttlMs);

    if (status !== 'claimed') {
      return { status };
    }

    return {
      status: 'acquired',
      lock: new RenewingLock(this.connection, key, token, ttlMs),
    };
  }

  async isLocked(
    name: string
  ): Promise<boolean | 'not-configured' | 'unavailable'> {
    if (!this.connection.shared) {
      return 'not-configured';
    }

    const holder = await this.connection.get(lockKey(name));

    return holder.ok ? holder.value !== null : 'unavailable';
  }
}
