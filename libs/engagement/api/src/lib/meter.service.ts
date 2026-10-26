import { Inject, Injectable } from '@nestjs/common';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { createHmac } from 'crypto';
import { Meter, emptyMeter, isMeter, mergeMeters } from './meter';
import { METER_SECRET, signMeter, verifyMeterToken } from './meter-token';
import { ReaderContext } from './reader-context';

export const METER_NAMESPACE = 'engagement:meters';

/**
 * Logged-in readers keep their meter on the server (the same on every device,
 * and it can not be reset by the browser). Anonymous readers keep it in a
 * signed token, which they can drop: the documented limit of an anonymous
 * meter.
 */
@Injectable()
export class MeterService {
  constructor(
    @Inject(METER_SECRET) private secret: Buffer,
    private kv: KvTtlCacheService
  ) {}

  async load(
    reader: ReaderContext,
    token: string | null | undefined
  ): Promise<Meter> {
    if (reader.privileged) {
      return emptyMeter();
    }

    const fromToken = verifyMeterToken(token, this.secret);

    if (!reader.userId) {
      return fromToken;
    }

    const stored = await this.kv.getNs<Meter>(
      METER_NAMESPACE,
      this.keyOf(reader.userId)
    );

    // Reads from before the login still count, so logging in resets nothing.
    return mergeMeters(isMeter(stored) ? stored : emptyMeter(), fromToken);
  }

  /** A token for anonymous readers to keep, `null` for logged-in ones. */
  async save(
    reader: ReaderContext,
    meter: Meter,
    maxWindowDays: number
  ): Promise<string | null> {
    if (!reader.userId) {
      return signMeter(meter, this.secret);
    }

    if (maxWindowDays > 0) {
      await this.kv.setNs(
        METER_NAMESPACE,
        this.keyOf(reader.userId),
        meter,
        maxWindowDays * 24 * 60 * 60
      );
    }

    return null;
  }

  private keyOf(userId: string) {
    return createHmac('sha256', this.secret)
      .update(`user:${userId}`)
      .digest('base64url');
  }
}
