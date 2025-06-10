import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {UserSubscriptionService} from './user-subscription.service'
import {UserSubscriptionResolver} from './user-subscription.resolver'
import {MemberPlanModule} from '@wepublish/member-plan/api'
import {RemoteSubscriptionsService} from './remote-subscriptions.service'

@Module({
  imports: [PrismaModule, MemberPlanModule],
  providers: [UserSubscriptionService, RemoteSubscriptionsService, UserSubscriptionResolver],
  exports: []
})
export class UserSubscriptionModule {}
