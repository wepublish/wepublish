import {
  DynamicModule,
  FactoryProvider,
  Module,
  ModuleMetadata,
} from '@nestjs/common';
import { ImageModule } from '@wepublish/image/api';
import { GraphqlResponseCacheModule } from '@wepublish/kv-ttl-cache/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { EngagementPromptsResolver } from './engagement-prompts.resolver';
import { EngagementRuleResolver } from './engagement-rule.resolver';
import { EngagementRuleService } from './engagement-rule.service';
import { EngagementStageResolver } from './engagement-stage.resolver';
import { MeterService } from './meter.service';
import { METER_SECRET } from './meter-token';
import {
  NewsletterVerifier,
  UnavailableNewsletterVerifier,
} from './newsletter-verifier';
import { ReaderContextService } from './reader-context.service';

@Module({
  imports: [PrismaModule, GraphqlResponseCacheModule, ImageModule],
  providers: [
    EngagementRuleService,
    EngagementRuleResolver,
    EngagementStageResolver,
    EngagementPromptsResolver,
    ReaderContextService,
    MeterService,
    { provide: NewsletterVerifier, useClass: UnavailableNewsletterVerifier },
  ],
  exports: [EngagementRuleService, ReaderContextService, MeterService],
})
export class EngagementModule {}

/**
 * Provides the key the anonymous meter tokens are signed with, everywhere
 * (`MeterService` is used by `EngagementModule` and `ArticleModule`).
 */
@Module({})
export class EngagementMeterSecretModule {
  static registerAsync({
    imports,
    inject,
    useFactory,
  }: Pick<ModuleMetadata, 'imports'> &
    Pick<FactoryProvider<Buffer>, 'inject' | 'useFactory'>): DynamicModule {
    return {
      module: EngagementMeterSecretModule,
      global: true,
      imports,
      providers: [{ provide: METER_SECRET, useFactory, inject }],
      exports: [METER_SECRET],
    };
  }
}
