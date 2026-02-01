import { PaymentMethodService } from './payment-method.service';
import { PaymentMethodDataloader } from './payment-method.dataloader';
import { PaymentProviderDataloader } from './payment-provider.dataloader';
import { HasPaymentMethodResolver } from './has-payment-method/has-payment-method.resolver';
import { PaymentMethodResolver } from './payment-method.resolver';
import {
  DynamicModule,
  Module,
  ModuleMetadata,
  Provider,
  Type,
} from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import {
  PaymentMethodConfig,
  PAYMENT_METHOD_CONFIG,
} from './payment-method.config';
import { PaymentProviderService } from './payment-provider.service';

type PaymentMethodConfigType = Type<PaymentMethodConfig>;

export type PaymentMethodOptionsFactory = {
  createPaymentMethodOptions():
    | Promise<PaymentMethodConfigType>
    | PaymentMethodConfigType;
};

export interface PaymentMethodClientAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<PaymentMethodOptionsFactory>;
  useClass?: Type<PaymentMethodOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<PaymentMethodConfig> | PaymentMethodConfig;
  inject?: Type[];
  global?: boolean;
}

@Module({
  imports: [PrismaModule],
  providers: [
    PaymentMethodService,
    PaymentMethodDataloader,
    PaymentProviderDataloader,
    PaymentMethodResolver,
    HasPaymentMethodResolver,
    PaymentProviderService,
  ],
  exports: [PaymentMethodDataloader, PaymentProviderDataloader],
})
export class PaymentMethodModule {
  public static register(config: PaymentMethodConfigType): DynamicModule {
    return {
      module: PaymentMethodModule,
      providers: [
        {
          provide: PAYMENT_METHOD_CONFIG,
          useValue: config,
        },
      ],
      exports: [PAYMENT_METHOD_CONFIG],
    };
  }

  public static registerAsync(
    options: PaymentMethodClientAsyncOptions
  ): DynamicModule {
    return {
      module: PaymentMethodModule,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
      exports: [PAYMENT_METHOD_CONFIG],
      global: options.global,
    };
  }

  private static createAsyncProviders(
    options: PaymentMethodClientAsyncOptions
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }

    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass!,
        useClass: options.useClass!,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: PaymentMethodClientAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        provide: PAYMENT_METHOD_CONFIG,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: PAYMENT_METHOD_CONFIG,
      useFactory: async (optionsFactory: PaymentMethodOptionsFactory) =>
        await optionsFactory.createPaymentMethodOptions(),
      inject: [options.useExisting || options.useClass!],
    };
  }
}
