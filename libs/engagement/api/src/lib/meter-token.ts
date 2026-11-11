import { hkdfSync } from 'crypto';
import { Meter, emptyMeter, isMeter } from './meter';
import { signPayload, verifyPayload } from './signed-token';

/**
 * Anonymous readers keep their meter in the browser, signed so it can not be
 * changed (`signed-token.ts`). Dropping it starts over, which is
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

export const signMeter = (meter: Meter, secret: Buffer) =>
  signPayload(meter, secret);

export function verifyMeterToken(
  token: string | null | undefined,
  secret: Buffer
): Meter {
  const meter = verifyPayload(token, secret);

  return isMeter(meter) ? meter : emptyMeter();
}
