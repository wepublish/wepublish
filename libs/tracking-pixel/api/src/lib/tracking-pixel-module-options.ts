import {TrackingPixelProvider} from './tracking-pixel-provider/tracking-pixel-provider'
import {ModuleAsyncOptions} from '@wepublish/utils/api'

export const TRACKING_PIXEL_MODULE_OPTIONS = 'TRACKING_PIXEL_MODULE_OPTIONS'

export interface TrackingPixelModuleOptions {
  trackingPixelProviders: TrackingPixelProvider[]
}

export type TrackingPixelModuleAsyncOptions = ModuleAsyncOptions<TrackingPixelModuleOptions>
