import {DynamicModule, Module, ModuleMetadata, Provider, Type} from '@nestjs/common'
import {
  MediaService,
  MediaServiceConfig,
  MEDIA_SERVICE_MODULE_OPTIONS,
  MEDIA_SERVICE_TOKEN
} from './media.service'
import {StorageClientModule} from '../storage-client/storage-client.module'
import {MediaServiceConfigModule} from './media-config.module'

export type MediaOptionsFactory = {
  createMediaOptions(): Promise<MediaServiceConfig> | MediaServiceConfig
}

export interface MediaServiceAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<MediaOptionsFactory>
  useClass?: Type<MediaOptionsFactory>
  useFactory?: (...args: any[]) => Promise<MediaServiceConfig> | MediaServiceConfig
  inject?: any[]
}

@Module({
  imports: [MediaServiceConfigModule],
  exports: [MediaServiceConfigModule]
})
export class MediaServiceModule {
  public static forRoot(config: MediaServiceConfig): DynamicModule {
    return {
      module: MediaServiceModule,
      imports: [StorageClientModule.forFeature()],
      providers: [
        {
          provide: MEDIA_SERVICE_MODULE_OPTIONS,
          useValue: config
        },
        {
          provide: MEDIA_SERVICE_TOKEN,
          useClass: MediaService
        },
        {
          provide: MediaService,
          useExisting: MEDIA_SERVICE_TOKEN
        }
      ],
      exports: [MediaService]
    }
  }

  public static forRootAsync(options: MediaServiceAsyncOptions): DynamicModule {
    return {
      module: MediaServiceModule,
      imports: [StorageClientModule.forFeature(), ...(options.imports || [])],
      providers: this.createAsyncProviders(options),
      exports: [MediaService]
    }
  }

  public static forFeature(): DynamicModule {
    return {
      module: MediaServiceModule,
      imports: [StorageClientModule.forFeature()],
      providers: [
        {
          provide: MediaService,
          useExisting: MEDIA_SERVICE_TOKEN
        }
      ]
    }
  }

  private static createAsyncProviders(options: MediaServiceAsyncOptions): Provider[] {
    return [
      {
        provide: MEDIA_SERVICE_TOKEN,
        useClass: MediaService
      },
      {
        provide: MediaService,
        useExisting: MEDIA_SERVICE_TOKEN
      },
      this.createAsyncOptionsProvider(options)
    ]
  }

  private static createAsyncOptionsProvider(options: MediaServiceAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: MEDIA_SERVICE_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || []
      }
    }

    return {
      provide: MEDIA_SERVICE_MODULE_OPTIONS,
      useFactory: async (optionsFactory: MediaOptionsFactory) =>
        await optionsFactory.createMediaOptions(),
      inject: [options.useExisting || options.useClass!]
    }
  }
}
