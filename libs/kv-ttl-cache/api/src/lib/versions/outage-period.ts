import { Injectable } from '@nestjs/common';
import { DragonflyConnection } from '@wepublish/dragonfly/api';
import { UNSHARED_FALLBACK_TTL_MS } from '../kv-cache-timings';

@Injectable()
export class OutagePeriod {
  constructor(private readonly connection: DragonflyConnection) {}

  suffix(): string {
    const since = this.connection.outageSince();

    if (since === undefined) {
      return '';
    }

    const period = Math.floor((Date.now() - since) / UNSHARED_FALLBACK_TTL_MS);

    return period ? `~${period}` : '';
  }
}
