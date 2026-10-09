import { Module } from '@nestjs/common';
import { KvTtlCacheModule } from './kv-ttl-cache.module';
import {
  GraphqlResponseCachePlugin,
  PublicContentCacheInvalidator,
} from './graphql-response-cache.plugin';

@Module({
  imports: [KvTtlCacheModule],
  providers: [GraphqlResponseCachePlugin, PublicContentCacheInvalidator],
  exports: [PublicContentCacheInvalidator, KvTtlCacheModule],
})
export class GraphqlResponseCacheModule {}
