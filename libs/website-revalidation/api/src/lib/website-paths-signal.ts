import { Injectable } from '@nestjs/common';
import { DragonflyConnection } from '@wepublish/dragonfly/api';
import {
  CatchUpScheduler,
  NamespaceVersions,
} from '@wepublish/kv-ttl-cache/api';
import { websitePathVersion } from './website-keys';
import { WEBSITE_REBUILD_AGAIN_MS } from './website-timings';

const WEBSITE_PATH_TTL_MS = 4 * 60 * 60 * 1000;

@Injectable()
export class WebsitePathsSignal {
  constructor(
    private readonly connection: DragonflyConnection,
    private readonly versions: NamespaceVersions,
    private readonly catchUp: CatchUpScheduler
  ) {}

  async changed(paths: readonly string[]): Promise<void> {
    if (!this.connection.shared) {
      return;
    }

    const names = [...new Set(paths.map(path => websitePathVersion(path)))];
    const write = () =>
      Promise.all(
        names.map(name =>
          this.versions.bump(name, { ttlMs: WEBSITE_PATH_TTL_MS })
        )
      );

    await write();
    this.catchUp.after(WEBSITE_REBUILD_AGAIN_MS, write);
  }
}
