import {
  type DynamicModule,
  Global,
  type InjectionToken,
  Module,
} from '@nestjs/common';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { DragonflyConnection, RELEASE_ID } from '@wepublish/dragonfly/api';
import { type DecimalCodec } from '../kv-ttl-cache-serializer';
import { type CacheProfile } from './cache-profile';
import { createKvCodec, KV_CODEC, type KvCodec } from './kv-codec';
import { LocalTier } from './local-tier';
import { SharePolicy } from './share-policy';
import { TieredKeyv, TieredKeyvStore } from './tiered-keyv-store';

@Module({})
class KvCacheFeatureModule {}

@Global()
@Module({})
export class KvCacheModule {
  static forRoot({ codec }: { codec?: DecimalCodec } = {}): DynamicModule {
    return {
      module: KvCacheModule,
      providers: [
        { provide: KV_CODEC, useValue: createKvCodec(codec) },
        { provide: LocalTier, useFactory: () => new LocalTier() },
        SharePolicy,
      ],
      exports: [KV_CODEC, LocalTier, SharePolicy],
    };
  }

  static forFeature(
    token: InjectionToken,
    profile: CacheProfile
  ): DynamicModule {
    return {
      module: KvCacheFeatureModule,
      imports: [
        CacheModule.registerAsync({
          inject: [
            LocalTier,
            DragonflyConnection,
            KV_CODEC,
            SharePolicy,
            RELEASE_ID,
          ],
          useFactory: (
            local: LocalTier,
            connection: DragonflyConnection,
            codec: KvCodec,
            policy: SharePolicy,
            releaseId: string
          ) => {
            local.register(profile);

            return {
              stores: [
                new TieredKeyv(
                  new TieredKeyvStore({
                    local,
                    connection,
                    codec,
                    policy,
                    profile,
                    releaseId,
                  })
                ),
              ],
              nonBlocking: false,
              cacheId: `kv:${profile.name}`,
            };
          },
        }),
      ],
      providers: [{ provide: token, useExisting: CACHE_MANAGER }],
      exports: [token],
    };
  }
}
