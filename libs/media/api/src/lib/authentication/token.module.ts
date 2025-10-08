import {
  DynamicModule,
  Module,
  ModuleMetadata,
  Provider,
  Type,
} from '@nestjs/common';
import {
  TokenStrategy,
  TokenConfig,
  TOKEN_MODULE_OPTIONS,
} from './token.strategy';

export type TokenOptionsFactory = {
  createTokenOptions(): Promise<TokenConfig> | TokenConfig;
};

export interface TokenAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<TokenOptionsFactory>;
  useClass?: Type<TokenOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<TokenConfig> | TokenConfig;
  inject?: any[];
}

@Module({
  providers: [TokenStrategy],
  exports: [TokenStrategy],
})
export class TokenModule {
  public static register(config: TokenConfig): DynamicModule {
    return {
      module: TokenModule,
      providers: [
        {
          provide: TOKEN_MODULE_OPTIONS,
          useValue: config,
        },
      ],
    };
  }

  public static registerAsync(options: TokenAsyncOptions): DynamicModule {
    return {
      module: TokenModule,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
    };
  }

  private static createAsyncProviders(options: TokenAsyncOptions): Provider[] {
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
    options: TokenAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        provide: TOKEN_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: TOKEN_MODULE_OPTIONS,
      useFactory: async (optionsFactory: TokenOptionsFactory) =>
        await optionsFactory.createTokenOptions(),
      inject: [options.useExisting || options.useClass!],
    };
  }
}
