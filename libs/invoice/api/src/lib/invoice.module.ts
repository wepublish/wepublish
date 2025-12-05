import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { InvoiceItemResolver, InvoiceResolver } from './invoice.resolver';
import { InvoiceService } from './invoice.service';
import { InvoiceDataloader } from './invoice.dataloader';
import { PaymentsModule } from '@wepublish/payment/api';

@Module({
  imports: [PrismaModule, PaymentsModule],
  providers: [
    InvoiceService,
    InvoiceResolver,
    InvoiceItemResolver,
    InvoiceDataloader,
  ],
  exports: [InvoiceService, InvoiceDataloader],
})
export class InvoiceModule {}
