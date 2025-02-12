import {DynamicModule, Module, Provider} from '@nestjs/common'
import {TrackingPixelService} from './tracking-pixel.service'
import {createAsyncOptionsProvider} from '@wepublish/utils/api'
import {
  TrackingPixelModuleAsyncOptions,
  TRACKING_PIXEL_MODULE_OPTIONS,
  TrackingPixelModuleOptions
} from './tracking-pixel-module-options'

@Module({
  imports: [],
  exports: [TrackingPixelService]
})
export class TrackingPixelModule {
  static registerAsync(options: TrackingPixelModuleAsyncOptions): DynamicModule {
    return {
      module: TrackingPixelModule,
      global: options.global,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options)
    }
  }

  private static createAsyncProviders(options: TrackingPixelModuleAsyncOptions): Provider[] {
    return [
      createAsyncOptionsProvider<TrackingPixelModuleOptions>(
        TRACKING_PIXEL_MODULE_OPTIONS,
        options
      ),
      {
        provide: TrackingPixelService,
        useFactory: ({trackingPixelProviders}: TrackingPixelModuleOptions) =>
          new TrackingPixelService(trackingPixelProviders),
        inject: [TRACKING_PIXEL_MODULE_OPTIONS]
      }
    ]
  }
}
