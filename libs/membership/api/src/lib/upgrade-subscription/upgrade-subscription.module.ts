import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';

import { UpgradeSubscriptionResolver } from './upgrade-subscription.resolver';
import { MemberPlanModule } from '@wepublish/member-plan/api';
import { UpgradeSubscriptionService } from './upgrade-subscription.service';
import { MemberContextModule } from '../legacy/member-context.module';
import { GoodieModule } from '../goodie/goodie.module';
import { PaymentMethodModule, PaymentsModule } from '@wepublish/payment/api';
import { DiscountCodeModule } from '../discountCode/discountCode.module';
import { SettingModule } from '@wepublish/settings/api';

@Module({
  imports: [
    PrismaModule,
    MemberPlanModule,
    PaymentMethodModule,
    MemberContextModule,
    GoodieModule,
    PaymentsModule,
    DiscountCodeModule,
    SettingModule,
  ],
  providers: [UpgradeSubscriptionResolver, UpgradeSubscriptionService],
})
export class UpgradeSubscriptionModule {}
