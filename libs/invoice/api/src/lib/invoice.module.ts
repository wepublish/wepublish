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
import { PaymentMethodModule } from '@wepublish/payment/api';
import { UserModule } from '@wepublish/user/api';

@Module({
  imports: [PrismaModule, PaymentMethodModule, UserModule],
  providers: [
    HasInvoiceResolver,
    HasOptionalInvoiceResolver,
    HasInvoiceLcResolver,
    HasOptionalInvoiceLcResolver,
    InvoiceDataloader,
    InvoiceItemDataloader,
    InvoiceResolver,
    InvoiceItemResolver,
    InvoiceService,
  ],
  exports: [InvoiceDataloader],
})
export class InvoiceModule {}
