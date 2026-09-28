import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
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

export const SECOND_FACTOR_MAX_FAILURES = 5;
const SECOND_FACTOR_WINDOW_SECONDS = 60 * 60;
const FACTOR_CACHE_SECONDS = 60;

@Injectable()
export class LoginCodeSecondFactorService {
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

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
    const failures = (await this.kv.get<number>(key)) ?? 0;

    if (failures >= SECOND_FACTOR_MAX_FAILURES) {
      throw new TooManyAttemptsError();
    }

    if (matchesSecondFactor(factor, user, answer)) {
      await this.kv.del(key);
      return;
    }

    const next = failures + 1;
    await this.kv.set(key, next, SECOND_FACTOR_WINDOW_SECONDS);

    if (next >= SECOND_FACTOR_MAX_FAILURES) {
      throw new TooManyAttemptsError();
    }

    throw new SecondFactorInvalidError();
  }
}
