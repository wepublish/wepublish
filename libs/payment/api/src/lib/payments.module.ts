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

@Module({
  imports: [PrismaModule, PaymentMethodModule],
  providers: [PaymentsService, PaymentDataloader, PaymentsResolver],
  controllers: [PaymentWebhookController],
  exports: [PaymentsService, PaymentDataloader],
})
export class PaymentsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PaymentWebhookMiddleware)
      .forRoutes(PaymentWebhookController);
  }
}
