import { DistributedCounters } from '@wepublish/dragonfly/api';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import { LoginCodeRateLimiter } from './login-code-rate-limiter';
import {
  ChallengeRequiredError,
  TooManyAttemptsError,
} from './login-code.errors';

describe('LoginCodeRateLimiter', () => {
  const limiter = (dragonfly = new FakeDragonfly()) =>
    new LoginCodeRateLimiter(new DistributedCounters(dragonfly));

  it('locks a client after ten failures', async () => {
    const subject = limiter();

    for (let i = 0; i < 9; i++) {
      await subject.recordFailure('fp');
    }

    await expect(subject.assertAllowed('fp', false)).resolves.toBeUndefined();
    await subject.recordFailure('fp');
    await expect(subject.assertAllowed('fp', false)).rejects.toBeInstanceOf(
      TooManyAttemptsError
    );
    await expect(
      subject.assertAllowed('other', false)
    ).resolves.toBeUndefined();
  });

  it('clears a client after a successful login', async () => {
    const subject = limiter();

    for (let i = 0; i < 10; i++) {
      await subject.recordFailure('fp');
    }

    await subject.clear('fp');
    await expect(subject.assertAllowed('fp', false)).resolves.toBeUndefined();
  });

  it('requires a challenge once the global failure budget is spent', async () => {
    const subject = limiter();

    for (let i = 0; i < 100; i++) {
      await subject.recordFailure(`fp-${i}`);
    }

    await expect(subject.assertAllowed('fresh', false)).rejects.toBeInstanceOf(
      ChallengeRequiredError
    );
    await expect(subject.assertAllowed('fresh', true)).resolves.toBeUndefined();
  });

  it('locks a client whose failures are spread over replicas', async () => {
    const dragonfly = new FakeDragonfly();
    const a = limiter(dragonfly);
    const b = limiter(dragonfly);

    for (let i = 0; i < 9; i++) {
      await a.recordFailure('fp');
    }

    await b.recordFailure('fp');
    await expect(b.assertAllowed('fp', false)).rejects.toBeInstanceOf(
      TooManyAttemptsError
    );
  });
});
