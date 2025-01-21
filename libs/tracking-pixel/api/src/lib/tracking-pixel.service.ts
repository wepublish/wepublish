import {Injectable} from '@nestjs/common'
import {TrackingPixelProvider} from './tracking-pixel-provider/tracking-pixel-provider'

@Injectable()
export class TrackingPixelService {
  constructor(readonly trackingPixelProviders: TrackingPixelProvider[]) {}

  getProviders() {
    return this.trackingPixelProviders
  }

  findById(id: string) {
    return this.trackingPixelProviders.find(p => p.id === id)
  }
}
