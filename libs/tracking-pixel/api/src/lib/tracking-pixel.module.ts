import {
  DynamicModule,
  Global,
  Module,
  ModuleMetadata,
  Provider,
  Type,
} from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import {
  TRACKING_PIXEL_MODULE_OPTIONS,
  TrackingPixelModuleOptions,
  TrackingPixelService,
} from './tracking-pixel.service';
import { TrackingPixelDataloader } from './tracking-pixel.dataloader';

export type TrackingPixelsOptionsFactory = {
  createTrackingPixelsOptions():
    | Promise<TrackingPixelModuleOptions>
    | TrackingPixelModuleOptions;
};

export interface TrackingPixelsAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<TrackingPixelsOptionsFactory>;
  useClass?: Type<TrackingPixelsOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<TrackingPixelModuleOptions> | TrackingPixelModuleOptions;
  inject?: any[];
}

@Global()
@Module({
  imports: [PrismaModule],
  providers: [TrackingPixelService, TrackingPixelDataloader],
  exports: [TrackingPixelService, TrackingPixelDataloader],
})
export class TrackingPixelsModule {
  public static register(config: TrackingPixelModuleOptions): DynamicModule {
    return {
      module: TrackingPixelsModule,
      providers: [
        {
          provide: TRACKING_PIXEL_MODULE_OPTIONS,
          useValue: config,
        },
      ],
    };
  }

  public static registerAsync(
    options: TrackingPixelsAsyncOptions
  ): DynamicModule {
    return {
      module: TrackingPixelsModule,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
    };
  }

  private static createAsyncProviders(
    options: TrackingPixelsAsyncOptions
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
    options: TrackingPixelsAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        provide: TRACKING_PIXEL_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: TRACKING_PIXEL_MODULE_OPTIONS,
      useFactory: async (optionsFactory: TrackingPixelsOptionsFactory) =>
        await optionsFactory.createTrackingPixelsOptions(),
      inject: [options.useExisting || options.useClass!],
    };
  }
}
