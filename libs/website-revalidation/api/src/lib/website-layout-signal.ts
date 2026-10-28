import { Injectable } from '@nestjs/common';
import { DragonflyConnection } from '@wepublish/dragonfly/api';
import {
  CatchUpScheduler,
  NamespaceVersions,
} from '@wepublish/kv-ttl-cache/api';
import { WEBSITE_LAYOUT_VERSION } from './website-keys';
import { WEBSITE_REBUILD_AGAIN_MS } from './website-timings';

@Injectable()
export class WebsiteLayoutSignal {
  constructor(
    private readonly connection: DragonflyConnection,
    private readonly versions: NamespaceVersions,
    private readonly catchUp: CatchUpScheduler
  ) {}

  async changed(): Promise<void> {
    if (!this.connection.shared) {
      return;
    }

    await this.versions.bump(WEBSITE_LAYOUT_VERSION);
    this.catchUp.after(WEBSITE_REBUILD_AGAIN_MS, () =>
      this.versions.bump(WEBSITE_LAYOUT_VERSION)
    );
  }
}
