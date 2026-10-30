import { MiddlewareConsumer, Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { PaymentsService } from './payments.service';

import { PaymentDataloader } from './payment.dataloader';
import { PaymentMethodModule } from './payment-method/payment-method.module';
import { PaymentsResolver } from './payments.resolver';
import {
  PaymentWebhookController,
  PaymentWebhookMiddleware,
} from './payment.webhook';
import { InvoicePaidNotifier } from './invoice-paid.listener';
import { PaymentAuthorizationNotifier } from './payment-authorization.notifier';
import { SellableRegistry } from './sellable/sellable-registry.service';

@Module({
  imports: [PrismaModule, PaymentMethodModule],
  providers: [
    PaymentsService,
    PaymentDataloader,
    PaymentsResolver,
    InvoicePaidNotifier,
    PaymentAuthorizationNotifier,
    SellableRegistry,
  ],
  controllers: [PaymentWebhookController],
  exports: [
    PaymentsService,
    PaymentDataloader,
    InvoicePaidNotifier,
    PaymentAuthorizationNotifier,
    SellableRegistry,
  ],
})
export class PaymentsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PaymentWebhookMiddleware)
      .forRoutes(PaymentWebhookController);
  }
}
