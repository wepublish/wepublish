import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import {
  HasOptionalInvoiceLcResolver,
  HasOptionalInvoiceResolver,
  HasInvoiceLcResolver,
  HasInvoiceResolver,
} from './has-invoice/has-invoice.resolver';
import { InvoiceDataloader } from './invoice.dataloader';
import { InvoiceItemResolver, InvoiceResolver } from './invoice.resolver';
import { InvoiceService } from './invoice.service';
import { InvoiceItemDataloader } from './invoice-items.dataloader';
import { InvoicePaymentsDataloader } from './invoice-payments.dataloader';
import { PaymentMethodModule, PaymentsModule } from '@wepublish/payment/api';
import { UserModule } from '@wepublish/user/api';

@Module({
  imports: [PrismaModule, PaymentMethodModule, PaymentsModule, UserModule],
  providers: [
    HasInvoiceResolver,
    HasOptionalInvoiceResolver,
    HasInvoiceLcResolver,
    HasOptionalInvoiceLcResolver,
    InvoiceDataloader,
    InvoiceItemDataloader,
    InvoicePaymentsDataloader,
    InvoiceResolver,
    InvoiceItemResolver,
    InvoiceService,
  ],
  exports: [InvoiceDataloader],
})
export class InvoiceModule {}
