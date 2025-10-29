import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { UserSubscriptionService } from './user-subscription.service';
import { UserSubscriptionResolver } from './user-subscription.resolver';
import { MemberPlanModule } from '@wepublish/member-plan/api';
import { RemoteSubscriptionsService } from './remote-subscriptions.service';
import { PaymentMethodModule } from '@wepublish/payment-method/api';
import { UserModule } from '@wepublish/user/api';
import { MemberContextModule } from '@wepublish/membership/api';

@Module({
  imports: [
    PrismaModule,
    MemberPlanModule,
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
