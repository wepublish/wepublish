import { Global, Module } from '@nestjs/common';
import { FEATURES } from '@wepublish/features';
import { KvTtlCacheModule } from '@wepublish/kv-ttl-cache/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { FeatureGuard } from './feature.guard';
import { FeaturesResolver } from './features.resolver';
import { FeaturesService, parseFeatureList } from './features.service';
import { FEATURE_ENV_KEYS, FEATURE_REGISTRY } from './features.tokens';

@Global()
@Module({
  imports: [PrismaModule, KvTtlCacheModule],
  providers: [
    { provide: FEATURE_REGISTRY, useValue: FEATURES },
    {
      provide: FEATURE_ENV_KEYS,
      useFactory: () => parseFeatureList(process.env['WEP_FEATURES']),
    },
    FeaturesService,
    FeatureGuard,
    FeaturesResolver,
  ],
  exports: [FeaturesService, FeatureGuard, FEATURE_REGISTRY],
})
export class FeaturesModule {}
