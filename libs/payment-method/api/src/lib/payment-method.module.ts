import {Module} from '@nestjs/common'
import {PaymentMethodService} from './payment-method.service'
import {PrismaModule} from '@wepublish/nest-modules'
import {PaymentMethodDataloader} from './payment-method.dataloader'

@Module({
  imports: [PrismaModule],
  providers: [PaymentMethodService, PaymentMethodDataloader]
})
export class PaymentMethodModule {}
