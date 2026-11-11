import { BadRequestException } from '@nestjs/common';
import { deriveMeterSecret } from './meter-token';
import { NewsletterSignupService } from './newsletter-signup.service';
import {
  deriveNewsletterSecret,
  verifyNewsletterToken,
} from './newsletter-token';

const meterSecret = deriveMeterSecret('a jwt private key');

describe('NewsletterSignupService', () => {
  const subscribe = vi.fn();
  const service = new NewsletterSignupService(meterSecret, {
    subscribe,
  } as never);

  beforeEach(() => {
    subscribe.mockReset().mockResolvedValue(true);
  });

  it('signs the reader up and hands back a token with their email', async () => {
    const token = await service.signUp(' Reader@Example.com ');

    expect(subscribe).toHaveBeenCalledWith('reader@example.com');
    expect(
      verifyNewsletterToken(token, deriveNewsletterSecret(meterSecret))
    ).toEqual({ email: 'reader@example.com', signedUpAt: expect.any(Date) });
  });

  it.each(['', 'reader', 'reader@', '@example.com', 'a b@example.com'])(
    'refuses %j without signing anyone up',
    async email => {
      await expect(service.signUp(email)).rejects.toBeInstanceOf(
        BadRequestException
      );
      expect(subscribe).not.toHaveBeenCalled();
    }
  );

  it('still lets the reader past the wall without a Mailchimp integration', async () => {
    subscribe.mockResolvedValue(false);

    expect(service.statusOf(await service.signUp('reader@example.com'))).toBe(
      'subscribed'
    );
  });

  it('lets no one past the wall when Mailchimp refused the address', async () => {
    subscribe.mockRejectedValue(new Error('looks fake'));

    await expect(service.signUp('reader@example.com')).rejects.toThrow(
      'looks fake'
    );
  });

  it('only knows readers by a token it signed', () => {
    expect(service.statusOf(undefined)).toBe(undefined);
    expect(service.statusOf('made.up')).toBe(undefined);
  });
});
