import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { InvoiceItemResolver, InvoiceResolver } from './invoice.resolver';
import { InvoiceService } from './invoice.service';
import { InvoiceDataloader } from './invoice.dataloader';

@Module({
  imports: [PrismaModule],
  providers: [
    InvoiceService,
    InvoiceResolver,
    InvoiceItemResolver,
    InvoiceDataloader,
  ],
  exports: [InvoiceService, InvoiceDataloader],
})
export class InvoiceModule {}
