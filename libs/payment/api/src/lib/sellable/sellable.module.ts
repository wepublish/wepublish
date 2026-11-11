import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { PaymentsModule } from '../payments.module';
import { SellableCheckoutService } from './sellable-checkout.service';
import { SellableFulfilmentService } from './sellable-fulfilment.service';
import { SellableReconciliationService } from './sellable-reconciliation.service';

@Module({
  imports: [PrismaModule, PaymentsModule],
  providers: [
    SellableFulfilmentService,
    SellableCheckoutService,
    SellableReconciliationService,
  ],
  exports: [SellableCheckoutService, SellableReconciliationService],
})
export class SellableModule {}
