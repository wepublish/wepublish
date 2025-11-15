import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';

import { UpgradeSubscriptionResolver } from './upgrade-subscription.resolver';
import { MemberPlanModule } from '@wepublish/member-plan/api';
import { PaymentMethodModule } from '@wepublish/payment-method/api';
import { UpgradeSubscriptionService } from './upgrade-subscription.service';
import { MemberContextModule } from '../legacy/member-context.module';

@Module({
  imports: [
    PrismaModule,
    MemberPlanModule,
    PaymentMethodModule,
    MemberContextModule,
  ],
  providers: [UpgradeSubscriptionResolver, UpgradeSubscriptionService],
})
export class UpgradeSubscriptionModule {}
