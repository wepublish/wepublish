import {Module} from '@nestjs/common'
import {PaymentMethodService} from './payment-method.service'
import {PrismaModule} from '@wepublish/nest-modules'
import {PaymentMethodDataloader} from './payment-method.dataloader'
import {
  HasOptionalPaymentMethodLcResolver,
  HasOptionalPaymentMethodResolver,
  HasPaymentMethodLcResolver,
  HasPaymentMethodResolver
} from './has-payment-method/has-payment-method.resolver'
import {PaymentMethodResolver} from './payment-method.resolver'

@Module({
  imports: [PrismaModule],
  providers: [
    PaymentMethodService,
    PaymentMethodDataloader,
    PaymentMethodResolver,
    HasPaymentMethodResolver,
    HasPaymentMethodLcResolver,
    HasOptionalPaymentMethodResolver,
    HasOptionalPaymentMethodLcResolver
  ],
  exports: [PaymentMethodService, PaymentMethodDataloader]
})
export class PaymentMethodModule {}
