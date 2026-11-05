import { Module } from '@nestjs/common';
import { ReleaseAnnouncer } from './release-announcer';
import { WebsiteHeartbeat } from './website-heartbeat';
import { WebsitePagesWatcher } from './website-pages-watcher';
import { WebsiteSignalsModule } from './website-signals.module';

@Module({
  imports: [WebsiteSignalsModule],
  providers: [WebsitePagesWatcher, WebsiteHeartbeat, ReleaseAnnouncer],
})
export class WebsiteRevalidationModule {}
