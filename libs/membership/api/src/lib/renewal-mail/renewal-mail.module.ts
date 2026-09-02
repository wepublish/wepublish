import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { INVOICE_PAID_LISTENER } from '@wepublish/payment/api';
import { RenewalSuccessMailService } from './renewal-success-mail.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    RenewalSuccessMailService,
    {
      provide: INVOICE_PAID_LISTENER,
      useExisting: RenewalSuccessMailService,
    },
  ],
  exports: [RenewalSuccessMailService, INVOICE_PAID_LISTENER],
})
export class RenewalMailModule {}
