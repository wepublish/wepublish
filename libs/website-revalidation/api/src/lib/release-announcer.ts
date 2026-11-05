import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import {
  DEV_RELEASE_ID,
  DistributedClaims,
  DragonflyConnection,
  DragonflyHealth,
  RELEASE_ID,
} from '@wepublish/dragonfly/api';
import { RELEASE_KEY } from './website-keys';
import { WebsiteLayoutSignal } from './website-layout-signal';
import { WebsitePagesSignal } from './website-pages-signal';

const RELEASE_CLAIM_MS = 10 * 60 * 1000;

@Injectable()
export class ReleaseAnnouncer implements OnApplicationBootstrap {
  constructor(
    @Inject(RELEASE_ID) private readonly releaseId: string,
    private readonly connection: DragonflyConnection,
    private readonly health: DragonflyHealth,
    private readonly claims: DistributedClaims,
    private readonly pages: WebsitePagesSignal,
    private readonly layout: WebsiteLayoutSignal
  ) {}

  async onApplicationBootstrap() {
    await this.announce();
  }

  async announce(): Promise<void> {
    if (
      !this.connection.shared ||
      this.releaseId === DEV_RELEASE_ID ||
      !(await this.health.bootCheck())
    ) {
      return;
    }

    const reply = await this.connection.get(RELEASE_KEY);
    const current = reply.ok ? reply.value : undefined;

    if (current === this.releaseId) {
      return;
    }

    const claimed = await this.claims.claim(
      `release:${this.releaseId}:after:${current ?? 'none'}`,
      RELEASE_CLAIM_MS
    );

    if (claimed !== 'claimed') {
      return;
    }

    await this.connection.set(RELEASE_KEY, this.releaseId);
    await this.pages.recordChange();
    await this.layout.changed();
  }
}
