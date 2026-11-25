import { ForbiddenException } from '@nestjs/common';
import {
  DistributedCounters,
  MemoryDragonflyConnection,
} from '@wepublish/dragonfly/api';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import {
  GIFT_CODE_MAX_ATTEMPTS,
  GiftCodeAttemptLimiter,
} from './gift-code-attempt-limiter';

const reserveTimes = async (limiter: GiftCodeAttemptLimiter, times: number) => {
  for (let i = 0; i < times; i++) {
    await limiter.reserve('user-1');
  }
};

describe('GiftCodeAttemptLimiter', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it(`allows ${GIFT_CODE_MAX_ATTEMPTS} attempts and blocks the next one`, async () => {
    const limiter = new GiftCodeAttemptLimiter(
      new DistributedCounters(new MemoryDragonflyConnection())
    );

    await reserveTimes(limiter, GIFT_CODE_MAX_ATTEMPTS);

    await expect(limiter.reserve('user-1')).rejects.toThrow(ForbiddenException);
  });

  it('counts every user on their own', async () => {
    const limiter = new GiftCodeAttemptLimiter(
      new DistributedCounters(new MemoryDragonflyConnection())
    );

    await reserveTimes(limiter, GIFT_CODE_MAX_ATTEMPTS);

    await expect(limiter.reserve('user-2')).resolves.toBeUndefined();
  });

  it('starts over after a successful attempt', async () => {
    const limiter = new GiftCodeAttemptLimiter(
      new DistributedCounters(new MemoryDragonflyConnection())
    );

    await reserveTimes(limiter, GIFT_CODE_MAX_ATTEMPTS);
    await limiter.forget('user-1');

    await expect(limiter.reserve('user-1')).resolves.toBeUndefined();
  });

  it('starts over an hour after the last attempt', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const limiter = new GiftCodeAttemptLimiter(
      new DistributedCounters(new MemoryDragonflyConnection())
    );

    await reserveTimes(limiter, GIFT_CODE_MAX_ATTEMPTS);
    vi.setSystemTime(Date.now() + 60 * 60 * 1000 + 1);

    await expect(limiter.reserve('user-1')).resolves.toBeUndefined();
  });

  it('shares the count between replicas through Dragonfly', async () => {
    const dragonfly = new FakeDragonfly();
    const first = new GiftCodeAttemptLimiter(
      new DistributedCounters(dragonfly)
    );
    const second = new GiftCodeAttemptLimiter(
      new DistributedCounters(dragonfly)
    );

    await reserveTimes(first, GIFT_CODE_MAX_ATTEMPTS);

    await expect(second.reserve('user-1')).rejects.toThrow(ForbiddenException);
  });

  it('still limits locally when Dragonfly is down', async () => {
    const dragonfly = new FakeDragonfly();
    dragonfly.down();
    const limiter = new GiftCodeAttemptLimiter(
      new DistributedCounters(dragonfly)
    );

    await reserveTimes(limiter, GIFT_CODE_MAX_ATTEMPTS);

    await expect(limiter.reserve('user-1')).rejects.toThrow(ForbiddenException);
  });
});
