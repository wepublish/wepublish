import { Module } from '@nestjs/common';
import { SubscriptionFlowService } from './subscription-flow.service';
import { SubscriptionFlowResolver } from './subscription-flow.resolver';
import { PrismaModule } from '@wepublish/nest-modules';
import { PaymentsModule } from '@wepublish/payment/api';

@Module({
  providers: [SubscriptionFlowResolver, SubscriptionFlowService],
  imports: [PrismaModule, PaymentsModule],
})
export class SubscriptionFlowModule {}
