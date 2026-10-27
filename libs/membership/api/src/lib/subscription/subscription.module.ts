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
import { SubscriptionService } from './subscription.service';
import { SubscriptionPeriodDataloader } from './subscription-periods.dataloader';
import { MemberContextModule } from '../legacy/member-context.module';
import { SubscriptionPeriodResolver } from './subscription-period.resolver';
import { InvoiceModule } from '../invoice/invoice.module';
import { SettingModule } from '@wepublish/settings/api';
import { PendingPaymentMethodChangeDataloader } from '../payment-method-change/pending-payment-method-change.dataloader';
import { PaymentMethodChangeModule } from '../payment-method-change/payment-method-change.module';

@Module({
  imports: [
    PrismaModule,
    MemberPlanModule,
    PaymentMethodModule,
    MemberContextModule,
    InvoiceModule,
    SettingModule,
    PaymentMethodChangeModule,
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
    PendingPaymentMethodChangeDataloader,
    PublicSubscriptionResolver,
    SubscriptionService,
  ],
  exports: [SubscriptionDataloader, SubscriptionService],
})
export class SubscriptionModule {}
