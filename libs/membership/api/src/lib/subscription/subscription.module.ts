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
import {PublicSubscriptionResolver} from './subscription.resolver'
import {MemberPlanModule} from '@wepublish/member-plan/api'
import {PaymentMethodModule} from '@wepublish/payment-method/api'

@Module({
  imports: [PrismaModule, MemberPlanModule, PaymentMethodModule],
  providers: [
    HasSubscriptionResolver,
    HasOptionalSubscriptionResolver,
    HasSubscriptionLcResolver,
    HasOptionalSubscriptionLcResolver,
    SubscriptionService,
    SubscriptionDataloader,
    PublicSubscriptionResolver
  ],
  exports: [SubscriptionService, SubscriptionDataloader]
})
export class SubscriptionModule {}
