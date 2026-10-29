import { Module } from '@nestjs/common';
import { WebsiteLayoutSignal } from './website-layout-signal';
import { WebsitePagesSignal } from './website-pages-signal';
import { WebsitePathsSignal } from './website-paths-signal';

@Module({
  providers: [WebsitePagesSignal, WebsiteLayoutSignal, WebsitePathsSignal],
  exports: [WebsitePagesSignal, WebsiteLayoutSignal, WebsitePathsSignal],
})
export class WebsiteSignalsModule {}
