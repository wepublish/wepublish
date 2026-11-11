import { deriveMeterSecret, signMeter } from './meter-token';
import {
  deriveNewsletterSecret,
  signNewsletterToken,
  verifyNewsletterToken,
} from './newsletter-token';

const meterSecret = deriveMeterSecret('a jwt private key');
const secret = deriveNewsletterSecret(meterSecret);
const signedUpAt = new Date('2026-11-11T12:00:00Z');

describe('newsletter token', () => {
  it('reads back the email it signed', () => {
    const token = signNewsletterToken(
      { email: 'reader@example.com', signedUpAt },
      secret
    );

    expect(verifyNewsletterToken(token, secret)).toEqual({
      email: 'reader@example.com',
      signedUpAt,
    });
  });

  it('refuses a changed email', () => {
    const [, signature] = signNewsletterToken(
      { email: 'reader@example.com', signedUpAt },
      secret
    ).split('.');
    const payload = Buffer.from(
      JSON.stringify({ email: 'other@example.com', at: signedUpAt.getTime() })
    ).toString('base64url');

    expect(verifyNewsletterToken(`${payload}.${signature}`, secret)).toBe(
      undefined
    );
  });

  it('refuses a meter token, signed with the other key', () => {
    expect(
      verifyNewsletterToken(signMeter({ reads: [] }, meterSecret), secret)
    ).toBe(undefined);
  });

  it.each([undefined, null, '', 'garbage', 'a.b.c'])('refuses %j', token => {
    expect(verifyNewsletterToken(token, secret)).toBe(undefined);
  });
});
