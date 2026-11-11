import { hkdfSync } from 'crypto';
import { signPayload, verifyPayload } from './signed-token';

/**
 * What a reader who gave their email at a newsletter wall keeps in a cookie,
 * signed so it can not be made up: it gets them past the wall and keeps
 * newsletter prompts away. It proves a signup, not that the address is
 * theirs, which is all a wall that only asks for an email can know.
 */
export type NewsletterSignup = { email: string; signedUpAt: Date };

type Payload = { email: string; at: number };

const isPayload = (value: unknown): value is Payload =>
  !!value &&
  typeof value === 'object' &&
  typeof (value as Payload).email === 'string' &&
  Number.isInteger((value as Payload).at);

/** A key of its own, so a meter token never passes as a signup. */
export const deriveNewsletterSecret = (meterSecret: Buffer) =>
  Buffer.from(
    hkdfSync(
      'sha256',
      meterSecret,
      Buffer.alloc(0),
      'wep-engagement-newsletter',
      32
    )
  );

export const signNewsletterToken = (
  { email, signedUpAt }: NewsletterSignup,
  secret: Buffer
) => signPayload({ email, at: signedUpAt.getTime() } satisfies Payload, secret);

/** As long as the website keeps the cookie: a token posted somewhere ends. */
export const NEWSLETTER_TOKEN_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

export function verifyNewsletterToken(
  token: string | null | undefined,
  secret: Buffer,
  now = new Date()
): NewsletterSignup | undefined {
  const payload = verifyPayload(token, secret);

  if (
    !isPayload(payload) ||
    now.getTime() - payload.at > NEWSLETTER_TOKEN_MAX_AGE_MS
  ) {
    return undefined;
  }

  return { email: payload.email, signedUpAt: new Date(payload.at) };
}
