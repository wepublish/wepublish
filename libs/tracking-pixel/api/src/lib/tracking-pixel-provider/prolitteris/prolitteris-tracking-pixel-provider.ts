import {
  BaseTrackingPixelProvider,
  CreateTrackingPixelProps,
  TrackingPixelProps
} from '../tracking-pixel-provider'
import {GatewayClient} from './client-gateway'
export interface ProLitterisCountPixelProps extends TrackingPixelProps {
  username: string
  memberNr: string
  password: string
  onlyPaidContentAccess: boolean
}

export class ProlitterisTrackingPixelProvider extends BaseTrackingPixelProvider {
  private gateway: GatewayClient
  private uriPaidContentIndicator: string = 'na'

  constructor(props: ProLitterisCountPixelProps) {
    super(props)
    this.gateway = new GatewayClient(props.memberNr, props.username, props.password, this.id)
    if (props.onlyPaidContentAccess) {
      this.uriPaidContentIndicator = 'pw'
    }
  }

  async createPixelUris(props: CreateTrackingPixelProps): Promise<string[]> {
    let tackingPixelUris: string[] = []
    const trackingPixels = await this.gateway.getTrackingPixels(props.count)
    for (const trackingPixel of trackingPixels.pixelUid) {
      tackingPixelUris.push(
        `https://${trackingPixels.domain}/${this.uriPaidContentIndicator}/${trackingPixel}`
      )
    }
    return tackingPixelUris
  }
}
