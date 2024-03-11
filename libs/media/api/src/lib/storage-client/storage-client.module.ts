import {DynamicModule, Module, ModuleMetadata, Provider, Type} from '@nestjs/common'
import {
  StorageClient,
  StorageClientConfig,
  STORAGE_CLIENT_MODULE_OPTIONS,
  STORAGE_CLIENT_SERVICE_TOKEN
} from './storage-client.service'
import {StorageClientConfigModule} from './storage-client-config.module'

export type StorageOptionsFactory = {
  createStorageOptions(): Promise<StorageClientConfig> | StorageClientConfig
}

export interface StorageClientAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<StorageOptionsFactory>
  useClass?: Type<StorageOptionsFactory>
  useFactory?: (...args: any[]) => Promise<StorageClientConfig> | StorageClientConfig
  inject?: any[]
}

@Module({
  imports: [StorageClientConfigModule],
  exports: [StorageClientConfigModule]
})
export class StorageClientModule {
  public static forRoot(config: StorageClientConfig): DynamicModule {
    return {
      module: StorageClientModule,
      providers: [
        {
          provide: STORAGE_CLIENT_MODULE_OPTIONS,
          useValue: config
        },
        {
          provide: STORAGE_CLIENT_SERVICE_TOKEN,
          useClass: StorageClient
        },
        {
          provide: StorageClient,
          useExisting: STORAGE_CLIENT_SERVICE_TOKEN
        }
      ],
      exports: [StorageClient]
    }
  }

  public static forRootAsync(options: StorageClientAsyncOptions): DynamicModule {
    return {
      module: StorageClientModule,
      imports: [...(options.imports || [])],
      providers: this.createAsyncProviders(options),
      exports: [StorageClient]
    }
  }

  public static forFeature(): DynamicModule {
    return {
      module: StorageClientModule,
      providers: [
        {
          provide: StorageClient,
          useExisting: STORAGE_CLIENT_SERVICE_TOKEN
        }
      ],
      exports: [StorageClient]
    }
  }

  private static createAsyncProviders(options: StorageClientAsyncOptions): Provider[] {
    return [
      {
        provide: STORAGE_CLIENT_SERVICE_TOKEN,
        useClass: StorageClient
      },
      {
        provide: StorageClient,
        useExisting: STORAGE_CLIENT_SERVICE_TOKEN
      },
      this.createAsyncOptionsProvider(options)
    ]
  }

  private static createAsyncOptionsProvider(options: StorageClientAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: STORAGE_CLIENT_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || []
      }
    }

    return {
      provide: STORAGE_CLIENT_MODULE_OPTIONS,
      useFactory: async (optionsFactory: StorageOptionsFactory) =>
        await optionsFactory.createStorageOptions(),
      inject: [options.useExisting || options.useClass!]
    }
  }
}
