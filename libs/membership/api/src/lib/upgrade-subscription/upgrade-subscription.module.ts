import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';

import { UpgradeSubscriptionResolver } from './upgrade-subscription.resolver';
import { MemberPlanModule } from '@wepublish/member-plan/api';
import { UpgradeSubscriptionService } from './upgrade-subscription.service';
import { MemberContextModule } from '../legacy/member-context.module';
import { PaymentMethodModule, PaymentsModule } from '@wepublish/payment/api';
import { VoucherModule } from '../voucher/voucher.module';

@Module({
  imports: [
    PrismaModule,
    MemberPlanModule,
    PaymentMethodModule,
    MemberContextModule,
    PaymentsModule,
    VoucherModule,
  ],
  providers: [UpgradeSubscriptionResolver, UpgradeSubscriptionService],
})
export class UpgradeSubscriptionModule {}
