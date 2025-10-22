import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';

import { UpgradeSubscriptionResolver } from './upgrade-subscription.resolver';
import { MemberPlanModule } from '@wepublish/member-plan/api';
import { PaymentMethodModule } from '@wepublish/payment-method/api';

@Module({
  imports: [PrismaModule, MemberPlanModule, PaymentMethodModule],
  providers: [UpgradeSubscriptionResolver],
})
export class UpgradeSubscriptionModule {}
