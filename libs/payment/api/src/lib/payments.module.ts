import {DynamicModule, Module, Provider} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {PaymentService} from './payment.service'
import {createAsyncOptionsProvider} from '@wepublish/utils/api'
import {
  PAYMENTS_MODULE_OPTIONS,
  PaymentsModuleAsyncOptions,
  PaymentsModuleOptions
} from './payments-module-options'
import {PaymentDataloader} from './payment.dataloader'
import {PaymentResolver} from './payment.resolver'
import {PaymentProviderService} from './payment-provider.service'
import {PaymentMethodModule} from '@wepublish/payment-method/api'

@Module({
  imports: [PrismaModule, PaymentMethodModule],
  exports: [PaymentService, PaymentProviderService]
})
export class PaymentsModule {
  static registerAsync(options: PaymentsModuleAsyncOptions): DynamicModule {
    return {
      module: PaymentsModule,
      global: options.global,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options)
    }
  }

  private static createAsyncProviders(options: PaymentsModuleAsyncOptions): Provider[] {
    return [
      createAsyncOptionsProvider<PaymentsModuleOptions>(PAYMENTS_MODULE_OPTIONS, options),
      {
        provide: PaymentProviderService,
        useFactory: ({paymentProviders}: PaymentsModuleOptions) =>
          new PaymentProviderService(paymentProviders),
        inject: [PAYMENTS_MODULE_OPTIONS]
      },
      PaymentService,
      PaymentResolver,
      PaymentDataloader
    ]
  }
}
