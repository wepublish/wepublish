import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { DragonflyConnection } from '@wepublish/dragonfly/api';
import { WebsitePagesSignal } from './website-pages-signal';

export const PAGES_CHECK_MS = 5000;

@Injectable()
export class WebsitePagesWatcher
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private watch?: ReturnType<typeof setInterval>;

  constructor(
    private readonly connection: DragonflyConnection,
    private readonly pages: WebsitePagesSignal
  ) {}

  onApplicationBootstrap() {
    if (!this.connection.shared || this.watch) {
      return;
    }

    this.watch = setInterval(() => void this.pages.checkDue(), PAGES_CHECK_MS);
    this.watch.unref?.();
  }

  onModuleDestroy() {
    clearInterval(this.watch);
    this.watch = undefined;
  }
}
