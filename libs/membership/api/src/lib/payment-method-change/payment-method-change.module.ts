import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { PaymentsModule } from '@wepublish/payment/api';
import { SettingModule } from '@wepublish/settings/api';
import { MemberContextModule } from '../legacy/member-context.module';
import { PaymentMethodChangeResolver } from './payment-method-change.resolver';
import { PaymentMethodChangeService } from './payment-method-change.service';

@Module({
  imports: [PrismaModule, PaymentsModule, MemberContextModule, SettingModule],
  providers: [PaymentMethodChangeService, PaymentMethodChangeResolver],
  exports: [PaymentMethodChangeService],
})
export class PaymentMethodChangeModule {}
