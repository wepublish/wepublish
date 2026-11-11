import { ForbiddenException, Injectable } from '@nestjs/common';
import { DistributedCounters } from '@wepublish/dragonfly/api';

export const GIFT_CODE_MAX_ATTEMPTS = 10;

const WINDOW_MS = 60 * 60 * 1000;

const counterName = (userId: string) => `gift-code-attempts:${userId}`;

@Injectable()
export class GiftCodeAttemptLimiter {
  private local = new Map<string, { count: number; lastAttemptAt: number }>();

  constructor(private counters: DistributedCounters) {}

  async reserve(userId: string) {
    const now = Date.now();
    const known = this.local.get(userId);
    const entry =
      known && now - known.lastAttemptAt < WINDOW_MS ?
        { count: known.count + 1, lastAttemptAt: now }
      : { count: 1, lastAttemptAt: now };

    this.local.set(userId, entry);

    const shared = await this.counters.increment(
      counterName(userId),
      WINDOW_MS
    );

    if (
      entry.count > GIFT_CODE_MAX_ATTEMPTS ||
      (shared.status === 'counted' && shared.count > GIFT_CODE_MAX_ATTEMPTS)
    ) {
      throw new ForbiddenException(
        'Too many gift code attempts. Please try again in an hour.'
      );
    }
  }

  async forget(userId: string) {
    this.local.delete(userId);
    await this.counters.forget(counterName(userId));
  }
}
