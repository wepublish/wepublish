import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {
  HasOptionalSubscriptionLcResolver,
  HasOptionalSubscriptionResolver,
  HasSubscriptionLcResolver,
  HasSubscriptionResolver
} from './has-subscription/has-subscription.resolver'
import {SubscriptionService} from './subscription.service'
import {SubscriptionDataloader} from './subscription.dataloader'

@Module({
  imports: [PrismaModule],
  providers: [
    HasSubscriptionResolver,
    HasOptionalSubscriptionResolver,
    HasSubscriptionLcResolver,
    HasOptionalSubscriptionLcResolver,
    SubscriptionService,
    SubscriptionDataloader
  ],
  exports: []
})
export class SubscriptionModule {}
