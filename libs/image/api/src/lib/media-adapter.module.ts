import {
  DynamicModule,
  Global,
  Module,
  ModuleMetadata,
  Provider,
  Type,
} from '@nestjs/common';
import { MediaAdapter } from './media-adapter';

export type MediaAdapterFactory = {
  createMediaAdapter(): Promise<MediaAdapter> | MediaAdapter;
};

export interface MediaAdapterAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<MediaAdapterFactory>;
  useClass?: Type<MediaAdapterFactory>;
  useFactory?: (...args: any[]) => Promise<MediaAdapter> | MediaAdapter;
  inject?: any[];
}

@Global()
@Module({})
export class MediaAdapterModule {
  public static register(config: MediaAdapter): DynamicModule {
    return {
      module: MediaAdapterModule,
      providers: [
        {
          provide: MediaAdapter,
          useValue: config,
        },
      ],
      exports: [MediaAdapter],
    };
  }

  public static registerAsync(
    options: MediaAdapterAsyncOptions
  ): DynamicModule {
    return {
      module: MediaAdapterModule,
      imports: [...(options.imports || [])],
      providers: this.createAsyncProviders(options),
      exports: [MediaAdapter],
    };
  }

  private static createAsyncProviders(
    options: MediaAdapterAsyncOptions
  ): Provider[] {
    return [this.createAsyncOptionsProvider(options)];
  }

  private static createAsyncOptionsProvider(
    options: MediaAdapterAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        provide: MediaAdapter,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: MediaAdapter,
      useFactory: async (optionsFactory: MediaAdapterFactory) =>
        await optionsFactory.createMediaAdapter(),
      inject: [options.useExisting || options.useClass!],
    };
  }
}
