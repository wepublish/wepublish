import { createHmac, timingSafeEqual } from 'crypto';

/**
 * `base64url(json).base64url(hmac)`: readable by the browser, but not
 * changeable. Each kind of token signs with a key of its own.
 */
const sign = (payload: string, secret: Buffer) =>
  createHmac('sha256', secret).update(payload).digest('base64url');

export const signPayload = (value: unknown, secret: Buffer) => {
  const payload = Buffer.from(JSON.stringify(value)).toString('base64url');

  return `${payload}.${sign(payload, secret)}`;
};

/** The signed value, or `undefined` when the token does not verify. */
export function verifyPayload(
  token: string | null | undefined,
  secret: Buffer
): unknown {
  const parts = token?.split('.') ?? [];

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return undefined;
  }

  const [payload, signature] = parts;
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(signature);

  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return undefined;
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch {
    return undefined;
  }
}
