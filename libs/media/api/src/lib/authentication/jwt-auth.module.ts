import {
  DynamicModule,
  Global,
  Module,
  ModuleMetadata,
  Provider,
  Type,
} from '@nestjs/common';
import {
  JwksClientService,
  JwksClientConfig,
  JWKS_CLIENT_OPTIONS,
} from './jwks-client.service';
import { JwtAuthGuard } from './jwt-auth.guard';

export type JwtAuthOptionsFactory = {
  createJwtAuthOptions(): Promise<JwksClientConfig> | JwksClientConfig;
};

export interface JwtAuthAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<JwtAuthOptionsFactory>;
  useClass?: Type<JwtAuthOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<JwksClientConfig> | JwksClientConfig;
  inject?: any[];
}

@Global()
@Module({
  providers: [JwksClientService, JwtAuthGuard],
  exports: [JwksClientService, JwtAuthGuard],
})
export class JwtAuthModule {
  public static register(config: JwksClientConfig): DynamicModule {
    return {
      module: JwtAuthModule,
      providers: [
        {
          provide: JWKS_CLIENT_OPTIONS,
          useValue: config,
        },
      ],
    };
  }

  public static registerAsync(options: JwtAuthAsyncOptions): DynamicModule {
    return {
      module: JwtAuthModule,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
    };
  }

  private static createAsyncProviders(
    options: JwtAuthAsyncOptions
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
    options: JwtAuthAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        provide: JWKS_CLIENT_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: JWKS_CLIENT_OPTIONS,
      useFactory: async (optionsFactory: JwtAuthOptionsFactory) =>
        await optionsFactory.createJwtAuthOptions(),
      inject: [options.useExisting || options.useClass!],
    };
  }
}
