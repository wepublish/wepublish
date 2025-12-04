import {
  DynamicModule,
  Module,
  ModuleMetadata,
  Provider,
  Type,
} from '@nestjs/common';
import { V0_CONFIG, V0Resolver, V0Config } from './v0.resolver';

type V0ConfigType = Type<V0Config>;

export type V0OptionsFactory = {
  createV0Options(): Promise<V0ConfigType> | V0ConfigType;
};

export interface V0ClientAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<V0OptionsFactory>;
  useClass?: Type<V0OptionsFactory>;
  useFactory?: (...args: any[]) => Promise<V0Config> | V0Config;
  inject?: Type[];
}

@Module({
  imports: [],
  providers: [V0Resolver],
})
export class V0Module {
  public static register(config: V0ConfigType): DynamicModule {
    return {
      module: V0Module,
      providers: [
        {
          provide: V0_CONFIG,
          useValue: config,
        },
      ],
    };
  }

  public static registerAsync(options: V0ClientAsyncOptions): DynamicModule {
    return {
      module: V0Module,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
    };
  }

  private static createAsyncProviders(
    options: V0ClientAsyncOptions
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
    options: V0ClientAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        provide: V0_CONFIG,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: V0_CONFIG,
      useFactory: async (optionsFactory: V0OptionsFactory) =>
        await optionsFactory.createV0Options(),
      inject: [options.useExisting || options.useClass!],
    };
  }
}
