import {DynamicModule, Module, ModuleMetadata, Provider, Type} from '@nestjs/common'
import {
  StorageClient,
  StorageClientConfig,
  STORAGE_CLIENT_MODULE_OPTIONS
} from './storage-client.service'

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
  providers: [StorageClient],
  exports: [StorageClient]
})
export class StorageClientModule {
  public static register(config: StorageClientConfig): DynamicModule {
    return {
      module: StorageClientModule,
      providers: [
        {
          provide: STORAGE_CLIENT_MODULE_OPTIONS,
          useValue: config
        }
      ]
    }
  }

  public static registerAsync(options: StorageClientAsyncOptions): DynamicModule {
    return {
      module: StorageClientModule,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options)
    }
  }

  private static createAsyncProviders(options: StorageClientAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)]
    }

    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass!,
        useClass: options.useClass!
      }
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
