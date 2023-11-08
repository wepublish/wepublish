import {DynamicModule, Module, Provider} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {PaymentsService} from './payments.service'
import {createAsyncOptionsProvider} from '@wepublish/utils'
import {
  PAYMENTS_MODULE_OPTIONS,
  PaymentsModuleAsyncOptions,
  PaymentsModuleOptions
} from './payments-module-options'
import {PrismaClient} from '@prisma/client'

@Module({
  imports: [PrismaModule],
  exports: [PaymentsService]
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
        provide: PaymentsService,
        useFactory: (prisma: PrismaClient, {paymentProviders}: PaymentsModuleOptions) =>
          new PaymentsService(prisma, paymentProviders),
        inject: [PrismaClient, PAYMENTS_MODULE_OPTIONS]
      }
    ]
  }
}
