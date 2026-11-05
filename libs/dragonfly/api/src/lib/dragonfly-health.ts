import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DragonflyConnection } from './dragonfly-connection';
import { DRAGONFLY_OPTIONS, type DragonflyOptions } from './dragonfly-options';

export type DragonflyStatus = 'not-configured' | 'reachable' | 'unreachable';

export const HEALTH_PROBE_KEY = 'health';
const HEALTH_PROBE_TTL_MS = 60_000;

const logger = new Logger('Dragonfly');

@Injectable()
export class DragonflyHealth implements OnModuleInit {
  private booted?: Promise<boolean>;

  constructor(
    private readonly connection: DragonflyConnection,
    @Inject(DRAGONFLY_OPTIONS) private readonly options: DragonflyOptions
  ) {}

  async status(): Promise<DragonflyStatus> {
    if (!this.connection.shared) {
      return 'not-configured';
    }

    const written = await this.connection.probe(
      HEALTH_PROBE_KEY,
      String(Date.now()),
      HEALTH_PROBE_TTL_MS
    );

    return written ? 'reachable' : 'unreachable';
  }

  bootCheck(): Promise<boolean> {
    this.booted ??= this.connection
      .set(HEALTH_PROBE_KEY, String(Date.now()), { px: HEALTH_PROBE_TTL_MS })
      .then(written => written.ok && written.value);

    return this.booted;
  }

  async onModuleInit() {
    if (this.options.production && !this.options.url) {
      logger.warn(
        'REDIS_URL is not set: caches and their resets stay on this replica'
      );

      return;
    }

    if (this.connection.shared && !(await this.bootCheck())) {
      logger.error(
        'Dragonfly is not reachable at boot, caching on this replica until it is: check REDIS_URL, password, ACL user and CA'
      );
    }
  }
}
