import {Module} from '@nestjs/common'
import {PaymentMethodService} from './payment-method.service'
import {PaymentMethodResolver} from './payment-method.resolver'
import {PrismaModule} from '@wepublish/nest-modules'
import {PaymentMethodDataloader} from './payment-method.dataloader'

@Module({
  imports: [PrismaModule],
  providers: [PaymentMethodService, PaymentMethodResolver, PaymentMethodDataloader]
})
export class PaymentMethodModule {}
