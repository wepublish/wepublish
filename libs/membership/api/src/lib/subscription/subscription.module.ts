import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import {
  HasOptionalSubscriptionLcResolver,
  HasOptionalSubscriptionResolver,
  HasSubscriptionLcResolver,
  HasSubscriptionResolver,
} from './has-subscription/has-subscription.resolver';
import { SubscriptionService } from './subscription.service';
import { SubscriptionDataloader } from './subscription.dataloader';
import { PublicSubscriptionResolver } from './subscription.resolver';
import { MemberPlanModule } from '@wepublish/member-plan/api';
import { PaymentMethodModule, PaymentsModule } from '@wepublish/payment/api';
import { SubscriptionDeactivationDataloader } from './subscription-deactivation.dataloader';
import { PropertyModule } from '@wepublish/property/api';

@Module({
  imports: [
    PrismaModule,
    MemberPlanModule,
    PaymentsModule,
    PaymentMethodModule,
    PropertyModule,
  ],
  providers: [
    HasSubscriptionResolver,
    HasOptionalSubscriptionResolver,
    HasSubscriptionLcResolver,
    HasOptionalSubscriptionLcResolver,
    SubscriptionService,
    SubscriptionDataloader,
    SubscriptionDeactivationDataloader,
    PublicSubscriptionResolver,
  ],
  exports: [
    SubscriptionService,
    SubscriptionDataloader,
    SubscriptionDeactivationDataloader,
  ],
})
export class SubscriptionModule {}
