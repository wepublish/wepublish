import { Module } from '@nestjs/common';
import { KvCacheModule } from '@wepublish/kv-ttl-cache/api';
import { WebsiteSignalsModule } from '@wepublish/website-revalidation/api';
import { GraphqlResponseCachePlugin } from './graphql-response-cache.plugin';
import { PublicContentInvalidatorModule } from './public-content-invalidator.module';
import {
  GRAPHQL_RESPONSES_CACHE,
  GRAPHQL_RESPONSES_PROFILE,
} from './public-content-namespaces';
import { WebsiteResetListener } from './website-reset-listener';

@Module({
  imports: [
    PublicContentInvalidatorModule,
    WebsiteSignalsModule,
    KvCacheModule.forFeature(
      GRAPHQL_RESPONSES_CACHE,
      GRAPHQL_RESPONSES_PROFILE
    ),
  ],
  providers: [GraphqlResponseCachePlugin, WebsiteResetListener],
  exports: [PublicContentInvalidatorModule],
})
export class PublicContentCacheModule {}
