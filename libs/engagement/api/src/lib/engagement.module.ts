import {
  DynamicModule,
  FactoryProvider,
  Module,
  ModuleMetadata,
} from '@nestjs/common';
import { ImageModule } from '@wepublish/image/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { NewsletterModule } from '@wepublish/newsletter/api';
import { PublicContentInvalidatorModule } from '@wepublish/public-content-cache/api';
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
import { NewsletterSignupResolver } from './newsletter-signup.resolver';
import { NewsletterSignupService } from './newsletter-signup.service';
import { ReaderContextService } from './reader-context.service';

@Module({
  imports: [
    PrismaModule,
    PublicContentInvalidatorModule,
    ImageModule,
    NewsletterModule,
  ],
  providers: [
    EngagementRuleService,
    EngagementRuleResolver,
    EngagementStageResolver,
    EngagementPromptsResolver,
    ReaderContextService,
    MeterService,
    NewsletterSignupService,
    NewsletterSignupResolver,
    { provide: NewsletterVerifier, useClass: UnavailableNewsletterVerifier },
  ],
  exports: [
    EngagementRuleService,
    ReaderContextService,
    MeterService,
    NewsletterSignupService,
  ],
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
