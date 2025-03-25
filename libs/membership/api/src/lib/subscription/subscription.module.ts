import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {
  HasSubscriptionResolver,
  HasOptionalSubscriptionResolver
} from './has-subscription/has-subscription.resolver'

@Module({
  imports: [PrismaModule],
  providers: [HasSubscriptionResolver, HasOptionalSubscriptionResolver],
  exports: []
})
export class SubscriptionModule {}
