import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {MemberPlanService} from './member-plan.service'
import {MemberPlanResolver} from './member-plan.resolver'
import {PaymentMethodModule} from '@wepublish/payment-method/api'
import {AvailablePaymentMethodResolver} from './available-payment-method.resolver'

@Module({
  imports: [PrismaModule, PaymentMethodModule],
  providers: [MemberPlanService, MemberPlanResolver, AvailablePaymentMethodResolver],
  exports: [MemberPlanService]
})
export class MemberPlanModule {}
