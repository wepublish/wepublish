import { DynamicModule, Module, Provider } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { PaymentsService } from './payments.service';
import { createAsyncOptionsProvider } from '@wepublish/utils/api';
import {
  PAYMENTS_MODULE_OPTIONS,
  PaymentsModuleAsyncOptions,
  PaymentsModuleOptions,
} from './payments-module-options';
import { PrismaClient } from '@prisma/client';
import { PaymentDataloader } from './payment.dataloader';
import {
  PaymentMethodModule,
  PaymentMethodService,
} from '@wepublish/payment-method/api';
import { PaymentsResolver } from './payments.resolver';

@Module({
  imports: [PrismaModule, PaymentMethodModule],
  exports: [PaymentsService, PaymentDataloader],
})
export class PaymentsModule {
  static registerAsync(options: PaymentsModuleAsyncOptions): DynamicModule {
    return {
      module: PaymentsModule,
      global: options.global,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
    };
  }

  private static createAsyncProviders(
    options: PaymentsModuleAsyncOptions
  ): Provider[] {
    return [
      PaymentDataloader,
      PaymentsResolver,
      createAsyncOptionsProvider<PaymentsModuleOptions>(
        PAYMENTS_MODULE_OPTIONS,
        options
      ),
      {
        provide: PaymentsService,
        useFactory: (
          prisma: PrismaClient,
          { paymentProviders }: PaymentsModuleOptions,
          paymentMethodService: PaymentMethodService
        ) =>
          new PaymentsService(prisma, paymentProviders, paymentMethodService),
        inject: [PrismaClient, PAYMENTS_MODULE_OPTIONS, PaymentMethodService],
      },
    ];
  }
}
