import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { UserSubscriptionService } from './user-subscription.service';
import { UserSubscriptionResolver } from './user-subscription.resolver';
import { MemberPlanModule } from '@wepublish/member-plan/api';
import { RemoteSubscriptionsService } from './remote-subscriptions.service';
import { PaymentMethodModule, PaymentsModule } from '@wepublish/payment/api';
import { UserModule } from '@wepublish/user/api';
import { MemberContextModule } from '@wepublish/membership/api';

@Module({
  imports: [
    PrismaModule,
    MemberPlanModule,
    PaymentsModule,
    PaymentMethodModule,
    UserModule,
    MemberContextModule,
  ],
  providers: [
    UserSubscriptionService,
    RemoteSubscriptionsService,
    UserSubscriptionResolver,
  ],
})
export class UserSubscriptionModule {}
