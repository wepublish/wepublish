import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { PaymentsService } from './payments.service';

import { PaymentDataloader } from './payment.dataloader';
import { PaymentMethodModule } from './payment-method/payment-method.module';
import { PaymentsResolver } from './payments.resolver';

@Module({
  imports: [PrismaModule, PaymentMethodModule],
  providers: [PaymentsService, PaymentDataloader, PaymentsResolver],
  exports: [PaymentsService, PaymentDataloader],
})
export class PaymentsModule {}
