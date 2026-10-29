import { Inject, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FEATURES } from '@wepublish/features';
import { NamespacedCacheTestingModule } from '@wepublish/kv-ttl-cache/api/testing';
import { FeaturesModule } from './features.module';
import { FeaturesService } from './features.service';
import { FEATURE_REGISTRY } from './features.tokens';

@Injectable()
class Consumer {
  constructor(
    readonly features: FeaturesService,
    @Inject(FEATURE_REGISTRY) readonly registry: unknown
  ) {}
}

// a module that does not import FeaturesModule itself, like OneModule
@Module({ providers: [Consumer] })
class ConsumerModule {}

describe('FeaturesModule', () => {
  it('lets any module inject the service and the registry', async () => {
    const module = await Test.createTestingModule({
      imports: [
        NamespacedCacheTestingModule.forRoot(),
        FeaturesModule,
        ConsumerModule,
      ],
    }).compile();

    const consumer = module.get(Consumer);

    expect(consumer.features).toBeInstanceOf(FeaturesService);
    expect(consumer.registry).toBe(FEATURES);
  });
});
