import { Module } from '@nestjs/common';
import { WebsiteSignalsModule } from '@wepublish/website-revalidation/api';
import { PublicContentCacheInvalidator } from './public-content-cache-invalidator';

@Module({
  imports: [WebsiteSignalsModule],
  providers: [PublicContentCacheInvalidator],
  exports: [PublicContentCacheInvalidator],
})
export class PublicContentInvalidatorModule {}
