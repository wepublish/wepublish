import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { UserSubscriptionService } from './user-subscription.service';
import { UserSubscriptionResolver } from './user-subscription.resolver';
import { MemberPlanModule } from '@wepublish/member-plan/api';
import { PaymentMethodModule, PaymentsModule } from '@wepublish/payment/api';
import { UserModule } from '@wepublish/user/api';
import {
  GoodieModule,
  MemberContextModule,
  VoucherModule,
} from '@wepublish/membership/api';

@Module({
  imports: [
    PrismaModule,
    MemberPlanModule,
    PaymentsModule,
    PaymentMethodModule,
    UserModule,
    MemberContextModule,
    VoucherModule,
    GoodieModule,
  ],
  providers: [UserSubscriptionService, UserSubscriptionResolver],
})
export class UserSubscriptionModule {}
