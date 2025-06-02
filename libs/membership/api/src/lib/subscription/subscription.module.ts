import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {
  HasOptionalSubscriptionResolver,
  HasSubscriptionResolver
} from './has-subscription/has-subscription.resolver'
import {SubscriptionResolver} from './subscription.resolver'
import {SubscriptionService} from './subscription.service'

@Module({
  imports: [PrismaModule],
  providers: [
    HasSubscriptionResolver,
    HasOptionalSubscriptionResolver,
    SubscriptionResolver,
    SubscriptionService
  ],
  exports: []
})
export class SubscriptionModule {}
