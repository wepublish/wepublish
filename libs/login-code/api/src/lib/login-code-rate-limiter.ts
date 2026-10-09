import { Injectable } from '@nestjs/common';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import {
  ChallengeRequiredError,
  TooManyAttemptsError,
} from './login-code.errors';

const FINGERPRINT_MAX_FAILURES = 10;
const FINGERPRINT_WINDOW_SECONDS = 15 * 60;
const GLOBAL_MAX_FAILURES = 100;
const GLOBAL_WINDOW_SECONDS = 10 * 60;

@Injectable()
export class LoginCodeRateLimiter {
  constructor(private kv: KvTtlCacheService) {}

  private fingerprintKey(fingerprint: string | null) {
    return `login-code:fp:${fingerprint ?? 'unknown'}`;
  }

  private static readonly GLOBAL_KEY = 'login-code:global';

  async assertAllowed(fingerprint: string | null, hasValidChallenge: boolean) {
    const failures =
      (await this.kv.get<number>(this.fingerprintKey(fingerprint))) ?? 0;

    if (failures >= FINGERPRINT_MAX_FAILURES) {
      throw new TooManyAttemptsError();
    }

    const globalFailures =
      (await this.kv.get<number>(LoginCodeRateLimiter.GLOBAL_KEY)) ?? 0;

    if (globalFailures >= GLOBAL_MAX_FAILURES && !hasValidChallenge) {
      throw new ChallengeRequiredError();
    }
  }

  async recordFailure(fingerprint: string | null) {
    const key = this.fingerprintKey(fingerprint);
    const failures = ((await this.kv.get<number>(key)) ?? 0) + 1;
    await this.kv.set(key, failures, FINGERPRINT_WINDOW_SECONDS);

    const globalFailures =
      ((await this.kv.get<number>(LoginCodeRateLimiter.GLOBAL_KEY)) ?? 0) + 1;
    await this.kv.set(
      LoginCodeRateLimiter.GLOBAL_KEY,
      globalFailures,
      GLOBAL_WINDOW_SECONDS
    );
  }

  async clear(fingerprint: string | null) {
    await this.kv.del(this.fingerprintKey(fingerprint));
  }
}
