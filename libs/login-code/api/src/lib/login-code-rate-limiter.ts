import { Injectable } from '@nestjs/common';
import { DistributedCounters } from '@wepublish/dragonfly/api';
import { FailureCounter } from './failure-counter';
import {
  ChallengeRequiredError,
  TooManyAttemptsError,
} from './login-code.errors';

const FINGERPRINT_MAX_FAILURES = 10;
const FINGERPRINT_WINDOW_MS = 15 * 60 * 1000;
const GLOBAL_MAX_FAILURES = 100;
const GLOBAL_WINDOW_MS = 10 * 60 * 1000;

@Injectable()
export class LoginCodeRateLimiter {
  private failures: FailureCounter;

  constructor(counters: DistributedCounters) {
    this.failures = new FailureCounter(counters);
  }

  private fingerprintKey(fingerprint: string | null) {
    return `login-code:fp:${fingerprint ?? 'unknown'}`;
  }

  private static readonly GLOBAL_KEY = 'login-code:global';

  async assertAllowed(fingerprint: string | null, hasValidChallenge: boolean) {
    if (
      this.failures.count(this.fingerprintKey(fingerprint)) >=
      FINGERPRINT_MAX_FAILURES
    ) {
      throw new TooManyAttemptsError();
    }

    if (
      this.failures.count(LoginCodeRateLimiter.GLOBAL_KEY) >=
        GLOBAL_MAX_FAILURES &&
      !hasValidChallenge
    ) {
      throw new ChallengeRequiredError();
    }
  }

  async recordFailure(fingerprint: string | null) {
    await this.failures.record(
      this.fingerprintKey(fingerprint),
      FINGERPRINT_WINDOW_MS
    );
    await this.failures.record(
      LoginCodeRateLimiter.GLOBAL_KEY,
      GLOBAL_WINDOW_MS
    );
  }

  async clear(fingerprint: string | null) {
    await this.failures.forget(this.fingerprintKey(fingerprint));
  }
}
