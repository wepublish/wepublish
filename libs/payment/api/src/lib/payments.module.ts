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
import { BexioContactSyncService } from './payment-provider/bexio/bexio-contact-sync.service';
import { BexioSetupResolver } from './payment-provider/bexio/bexio-setup.resolver';

@Module({
  imports: [PrismaModule, PaymentMethodModule],
  providers: [
    PaymentsService,
    PaymentDataloader,
    PaymentsResolver,
    InvoicePaidNotifier,
    PaymentAuthorizationNotifier,
    BexioContactSyncService,
    BexioSetupResolver,
  ],
  controllers: [PaymentWebhookController],
  exports: [
    PaymentsService,
    PaymentDataloader,
    InvoicePaidNotifier,
    PaymentAuthorizationNotifier,
    BexioContactSyncService,
  ],
})
export class PaymentsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PaymentWebhookMiddleware)
      .forRoutes(PaymentWebhookController);
  }
}
