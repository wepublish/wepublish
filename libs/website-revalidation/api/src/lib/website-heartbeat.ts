import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { DragonflyConnection } from '@wepublish/dragonfly/api';
import { WEBSITE_HEARTBEAT_KEY } from './website-keys';

const WEBSITE_HEARTBEAT_EVERY_MS = 20_000;
const WEBSITE_HEARTBEAT_RETRY_MS = 5_000;
const WEBSITE_HEARTBEAT_TTL_MS = 60_000;

@Injectable()
export class WebsiteHeartbeat
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private next?: ReturnType<typeof setTimeout>;
  private beating = false;

  constructor(private readonly connection: DragonflyConnection) {}

  async onApplicationBootstrap() {
    if (!this.connection.shared || this.beating) {
      return;
    }

    this.beating = true;
    await this.beat();
  }

  onModuleDestroy() {
    this.beating = false;
    clearTimeout(this.next);
    this.next = undefined;
  }

  private async beat(): Promise<void> {
    const reply = await this.connection.set(
      WEBSITE_HEARTBEAT_KEY,
      String(Date.now()),
      { px: WEBSITE_HEARTBEAT_TTL_MS }
    );

    if (!this.beating) {
      return;
    }

    this.next = setTimeout(
      () => void this.beat(),
      reply.ok && reply.value ?
        WEBSITE_HEARTBEAT_EVERY_MS
      : WEBSITE_HEARTBEAT_RETRY_MS
    );
    this.next.unref?.();
  }
}
