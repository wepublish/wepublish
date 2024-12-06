import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {HasSubscriptionResolver} from './has-subscription/has-subscription.resolver'

@Module({
  imports: [PrismaModule],
  providers: [HasSubscriptionResolver],
  exports: []
})
export class SubscriptionModule {}
