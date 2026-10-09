import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';

@Injectable()
export class DragonflyHealthIndicator {
  constructor(
    private health: HealthIndicatorService,
    private kv: KvTtlCacheService
  ) {}

  async isHealthy<Key extends string>(key: Key) {
    const indicator = this.health.check(key);

    switch (await this.kv.dragonflyStatus()) {
      case 'reachable':
        return indicator.up();
      case 'not-configured':
        return indicator.down('REDIS_URL is not set');
      default:
        return indicator.down('Dragonfly is unreachable or refuses writes');
    }
  }
}
