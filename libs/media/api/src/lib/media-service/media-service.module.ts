import {
  DynamicModule,
  Module,
  ModuleMetadata,
  Provider,
  Type,
} from '@nestjs/common';
import {
  MediaService,
  MediaServiceConfig,
  MEDIA_SERVICE_MODULE_OPTIONS,
} from './media.service';

export type MediaOptionsFactory = {
  createMediaOptions(): Promise<MediaServiceConfig> | MediaServiceConfig;
};

export interface MediaServiceAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<MediaOptionsFactory>;
  useClass?: Type<MediaOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<MediaServiceConfig> | MediaServiceConfig;
  inject?: any[];
}

@Module({
  imports: [],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaServiceModule {
  public static forRoot(config: MediaServiceConfig): DynamicModule {
    return {
      module: MediaServiceModule,
      imports: [],
      providers: [
        {
          provide: MEDIA_SERVICE_MODULE_OPTIONS,
          useValue: config,
        },
      ],
    };
  }

  public static forRootAsync(options: MediaServiceAsyncOptions): DynamicModule {
    return {
      module: MediaServiceModule,
      imports: [...(options.imports || [])],
      providers: this.createAsyncProviders(options),
    };
  }

  private static createAsyncProviders(
    options: MediaServiceAsyncOptions
  ): Provider[] {
    return [this.createAsyncOptionsProvider(options)];
  }

  private static createAsyncOptionsProvider(
    options: MediaServiceAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        provide: MEDIA_SERVICE_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: MEDIA_SERVICE_MODULE_OPTIONS,
      useFactory: async (optionsFactory: MediaOptionsFactory) =>
        await optionsFactory.createMediaOptions(),
      inject: [options.useExisting || options.useClass!],
    };
  }
}
