import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { PaymentsModule } from '@wepublish/payment/api';
import { InvoiceDeliveryService } from './invoice-delivery.service';

@Module({
  imports: [PrismaModule, PaymentsModule],
  providers: [InvoiceDeliveryService],
  exports: [InvoiceDeliveryService],
})
export class InvoiceDeliveryModule {}
