import { AuthSessionType } from '@wepublish/authentication/api';
import { NewsletterSignupResolver } from './newsletter-signup.resolver';

describe('NewsletterSignupResolver', () => {
  const signUp = vi.fn();
  const validateChallenge = vi.fn();
  const signupProblem = vi.fn();
  const resolver = new NewsletterSignupResolver(
    { signUp } as never,
    { validateChallenge } as never,
    { signupProblem } as never
  );
  const answer = { challengeID: 'id', challengeSolution: 'solved' };

  beforeEach(() => {
    signUp.mockReset().mockResolvedValue('signed.token');
    validateChallenge.mockReset().mockResolvedValue({ valid: true });
  });

  it('signs an anonymous reader up once they solved the challenge', async () => {
    await expect(
      resolver.signUpForNewsletter('reader@example.com', answer, undefined)
    ).resolves.toEqual({ newsletterToken: 'signed.token' });
    expect(validateChallenge).toHaveBeenCalledWith({
      challengeID: 'id',
      solution: 'solved',
    });
  });

  it('signs no one up for a script that did not solve it', async () => {
    validateChallenge.mockResolvedValue({ valid: false, message: 'wrong' });

    await expect(
      resolver.signUpForNewsletter('victim@example.com', answer, undefined)
    ).rejects.toThrow('wrong');
    await expect(
      resolver.signUpForNewsletter('victim@example.com', null, undefined)
    ).rejects.toThrow();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('asks a logged-in reader for no challenge', async () => {
    await resolver.signUpForNewsletter('reader@example.com', null, {
      type: AuthSessionType.User,
    } as never);

    expect(validateChallenge).not.toHaveBeenCalled();
    expect(signUp).toHaveBeenCalledWith('reader@example.com');
  });

  it('tells editors why newsletter sign-ups can not reach Mailchimp', async () => {
    signupProblem.mockResolvedValue('incomplete');

    expect(await resolver.newsletterSignupProblem()).toBe('incomplete');
  });
});
