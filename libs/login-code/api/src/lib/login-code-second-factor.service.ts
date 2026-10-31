import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DistributedCounters } from '@wepublish/dragonfly/api';
import { NamespacedCache } from '@wepublish/kv-ttl-cache/api';
import { SettingName } from '@wepublish/settings/api';
import {
  SecondFactorInvalidError,
  TooManyAttemptsError,
} from './login-code.errors';
import {
  hasSecondFactor,
  LoginCodeSecondFactor,
  maskSecondFactor,
  matchesSecondFactor,
  parseLoginCodeSecondFactor,
  SecondFactorUser,
} from './login-code-second-factor';
import { FailureCounter } from './failure-counter';

export const SECOND_FACTOR_MAX_FAILURES = 5;
const SECOND_FACTOR_WINDOW_MS = 60 * 60 * 1000;
const FACTOR_CACHE_SECONDS = 60;

@Injectable()
export class LoginCodeSecondFactorService {
  private failures: FailureCounter;

  constructor(
    private prisma: PrismaClient,
    private kv: NamespacedCache,
    counters: DistributedCounters
  ) {
    this.failures = new FailureCounter(counters);
  }

  private failureKey(userId: string) {
    return `login-code:second-factor:${userId}`;
  }

  async getFactor(): Promise<LoginCodeSecondFactor> {
    return this.kv.getOrLoadNs<LoginCodeSecondFactor>(
      'login-code',
      'second-factor',
      async () => {
        const setting = await this.prisma.setting.findUnique({
          where: { name: SettingName.LOGIN_CODE_SECOND_FACTOR },
        });

        return parseLoginCodeSecondFactor(setting?.value);
      },
      FACTOR_CACHE_SECONDS
    );
  }

  async isAvailable(user: SecondFactorUser): Promise<boolean> {
    return hasSecondFactor(await this.getFactor(), user);
  }

  async mask<T extends SecondFactorUser>(user: T): Promise<T> {
    return maskSecondFactor(await this.getFactor(), user);
  }

  async assert(
    user: SecondFactorUser & { id: string },
    answer: string | null | undefined
  ): Promise<void> {
    const factor = await this.getFactor();

    if (factor === LoginCodeSecondFactor.none) {
      return;
    }

    const key = this.failureKey(user.id);

    if (this.failures.count(key) >= SECOND_FACTOR_MAX_FAILURES) {
      throw new TooManyAttemptsError();
    }

    if (matchesSecondFactor(factor, user, answer)) {
      await this.failures.forget(key);
      return;
    }

    if (
      (await this.failures.record(key, SECOND_FACTOR_WINDOW_MS)) >=
      SECOND_FACTOR_MAX_FAILURES
    ) {
      throw new TooManyAttemptsError();
    }

    throw new SecondFactorInvalidError();
  }
}
