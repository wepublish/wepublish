import { Module } from '@nestjs/common';
import { KvCacheModule } from '@wepublish/kv-ttl-cache/api';
import {
  LinkCache,
  MEDIA_GENERATION_CHECKS_CACHE,
  MEDIA_GENERATIONS_CACHE,
  MEDIA_LINKS_CACHE,
  MEDIA_MISSING_LINKS_CACHE,
  MEDIA_REJECTED_VARIANTS_CACHE,
} from './link-cache';

@Module({
  imports: [
    KvCacheModule.forFeature(MEDIA_LINKS_CACHE, {
      name: 'media:links',
      shared: true,
      scope: 'global',
      keyPrefix: 'media:links:',
    }),
    KvCacheModule.forFeature(MEDIA_REJECTED_VARIANTS_CACHE, {
      name: 'media:rejected-variants',
      shared: true,
      scope: 'release',
      keyPrefix: 'media:rejected-variants:',
    }),
    KvCacheModule.forFeature(MEDIA_MISSING_LINKS_CACHE, {
      name: 'media:missing-links',
      shared: false,
    }),
    KvCacheModule.forFeature(MEDIA_GENERATIONS_CACHE, {
      name: 'media:generations',
      shared: true,
      scope: 'global',
      keyPrefix: 'media:generations:',
    }),
    KvCacheModule.forFeature(MEDIA_GENERATION_CHECKS_CACHE, {
      name: 'media:generation-checks',
      shared: false,
    }),
  ],
  providers: [LinkCache],
  exports: [LinkCache],
})
export class MediaLinkCacheModule {}
