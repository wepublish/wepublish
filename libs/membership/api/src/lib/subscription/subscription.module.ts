import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import {
  HasOptionalSubscriptionLcResolver,
  HasOptionalSubscriptionResolver,
  HasSubscriptionLcResolver,
  HasSubscriptionResolver,
} from './has-subscription/has-subscription.resolver';
import { SubscriptionDataloader } from './subscription.dataloader';
import { PublicSubscriptionResolver } from './subscription.resolver';
import { MemberPlanModule } from '@wepublish/member-plan/api';
import { PaymentMethodModule } from '@wepublish/payment/api';
import { SubscriptionDeactivationDataloader } from './subscription-deactivation.dataloader';
import { PropertyModule } from '@wepublish/property/api';
import { SubscriptionService } from './subscription.service';
import { SubscriptionPeriodDataloader } from './subscription-periods.dataloader';
import { MemberContextModule } from '../legacy/member-context.module';
import { SubscriptionPeriodResolver } from './subscription-period.resolver';

@Module({
  imports: [
    PrismaModule,
    MemberPlanModule,
    PaymentMethodModule,
    PropertyModule,
    MemberContextModule,
  ],
  providers: [
    SubscriptionPeriodResolver,
    HasSubscriptionResolver,
    HasOptionalSubscriptionResolver,
    HasSubscriptionLcResolver,
    HasOptionalSubscriptionLcResolver,
    SubscriptionDataloader,
    SubscriptionDeactivationDataloader,
    SubscriptionPeriodDataloader,
    PublicSubscriptionResolver,
    SubscriptionService,
  ],
  exports: [SubscriptionDataloader],
})
export class SubscriptionModule {}
