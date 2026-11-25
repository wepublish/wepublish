import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { PaymentsModule } from '@wepublish/payment/api';
import { RenewalSuccessMailService } from './renewal-success-mail.service';

@Global()
@Module({
  imports: [PrismaModule, PaymentsModule],
  providers: [RenewalSuccessMailService],
  exports: [RenewalSuccessMailService],
})
export class RenewalMailModule {}
