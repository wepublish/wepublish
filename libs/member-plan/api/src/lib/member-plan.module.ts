import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { MemberPlanService } from './member-plan.service';
import { MemberPlanResolver } from './member-plan.resolver';
import { PaymentMethodModule } from '@wepublish/payment/api';
import { AvailablePaymentMethodResolver } from './available-payment-method.resolver';
import { MemberPlanDataloader } from './member-plan.dataloader';

@Module({
  imports: [PrismaModule, PaymentMethodModule],
  providers: [
    MemberPlanService,
    MemberPlanResolver,
    AvailablePaymentMethodResolver,
    MemberPlanDataloader,
  ],
  exports: [MemberPlanService, MemberPlanDataloader],
})
export class MemberPlanModule {}
