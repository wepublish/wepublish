import { createKvMock } from '@wepublish/kv-ttl-cache/api';
import { LoginCodeRateLimiter } from './login-code-rate-limiter';
import {
  ChallengeRequiredError,
  TooManyAttemptsError,
} from './login-code.errors';

describe('LoginCodeRateLimiter', () => {
  const limiter = () => new LoginCodeRateLimiter(createKvMock());

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
});
