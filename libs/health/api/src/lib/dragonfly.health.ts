import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { DragonflyHealth } from '@wepublish/dragonfly/api';

@Injectable()
export class DragonflyHealthIndicator {
  constructor(
    private health: HealthIndicatorService,
    private dragonfly: DragonflyHealth
  ) {}

  async isHealthy<Key extends string>(key: Key) {
    const indicator = this.health.check(key);

    switch (await this.dragonfly.status()) {
      case 'reachable':
        return indicator.up();
      case 'not-configured':
        return indicator.down('REDIS_URL is not set');
      default:
        return indicator.down('Dragonfly is unreachable or refuses writes');
    }
  }
}
