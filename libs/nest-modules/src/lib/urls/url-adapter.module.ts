import {
  DynamicModule,
  Global,
  Module,
  ModuleMetadata,
  Provider,
  Type,
} from '@nestjs/common';
import { URLAdapter } from './url-adapter';

export type URLAdapterFactory = {
  createUrlAdapter(): Promise<URLAdapter> | URLAdapter;
};

export interface URLAdapterAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<URLAdapterFactory>;
  useClass?: Type<URLAdapterFactory>;
  useFactory?: (...args: any[]) => Promise<URLAdapter> | URLAdapter;
  inject?: any[];
}

@Global()
@Module({})
export class URLAdapterModule {
  public static register(config: URLAdapter): DynamicModule {
    return {
      module: URLAdapterModule,
      providers: [
        {
          provide: URLAdapter,
          useValue: config,
        },
      ],
      exports: [URLAdapter],
    };
  }

  public static registerAsync(options: URLAdapterAsyncOptions): DynamicModule {
    return {
      module: URLAdapterModule,
      imports: [...(options.imports || [])],
      providers: this.createAsyncProviders(options),
      exports: [URLAdapter],
    };
  }

  private static createAsyncProviders(
    options: URLAdapterAsyncOptions
  ): Provider[] {
    return [this.createAsyncOptionsProvider(options)];
  }

  private static createAsyncOptionsProvider(
    options: URLAdapterAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        provide: URLAdapter,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: URLAdapter,
      useFactory: async (optionsFactory: URLAdapterFactory) =>
        await optionsFactory.createUrlAdapter(),
      inject: [options.useExisting || options.useClass!],
    };
  }
}
