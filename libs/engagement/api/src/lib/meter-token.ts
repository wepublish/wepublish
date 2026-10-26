import { createHmac, hkdfSync, timingSafeEqual } from 'crypto';
import { Meter, emptyMeter, isMeter } from './meter';

/**
 * Anonymous readers keep their meter in the browser, signed so it can not be
 * changed: `base64url(json).base64url(hmac)`. Dropping it starts over, which is
 * the documented limit of an anonymous meter. A token that does not verify
 * counts as an empty meter.
 */
export const METER_SECRET = Symbol('METER_SECRET');

export const deriveMeterSecret = (jwtPrivateKey: string) =>
  Buffer.from(
    hkdfSync(
      'sha256',
      jwtPrivateKey,
      Buffer.alloc(0),
      'wep-engagement-meter',
      32
    )
  );

const sign = (payload: string, secret: Buffer) =>
  createHmac('sha256', secret).update(payload).digest('base64url');

export const signMeter = (meter: Meter, secret: Buffer) => {
  const payload = Buffer.from(JSON.stringify(meter)).toString('base64url');

  return `${payload}.${sign(payload, secret)}`;
};

export function verifyMeterToken(
  token: string | null | undefined,
  secret: Buffer
): Meter {
  const parts = token?.split('.') ?? [];

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return emptyMeter();
  }

  const [payload, signature] = parts;
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(signature);

  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return emptyMeter();
  }

  try {
    const meter = JSON.parse(Buffer.from(payload, 'base64url').toString());

    return isMeter(meter) ? meter : emptyMeter();
  } catch {
    return emptyMeter();
  }
}
