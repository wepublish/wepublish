import {
  BaseTrackingPixelProvider,
  CreateTrackingPixelProps,
  PixelUrl,
  TrackingPixelProps
} from '../tracking-pixel-provider'
import {ProLitterisGenerator} from './types'

export interface ProLitterisCountPixelProps extends TrackingPixelProps {
  username?: string
  memberNr: string
  password?: string
  onlyPaidContentAccess: boolean
  usePublisherInternalKey: boolean
  publisherInternalKeyDomain?: string
}

export class ProlitterisTrackingPixelProvider extends BaseTrackingPixelProvider {
  private gateway: ProLitterisGenerator
  private uriPaidContentIndicator: string

  constructor(props: ProLitterisCountPixelProps) {
    super(props)
    // this.gateway = new GatewayClient(props.memberNr, props.username, props.password)
    // if (props.usePublisherInternalKey) {
    //   this.gateway = new InternalKey(props.memberNr, props.publisherInternalKeyDomain)
    // }
    // this.uriPaidContentIndicator = 'na'
    // if (props.onlyPaidContentAccess) {
    //   this.uriPaidContentIndicator = 'pw'
    // }
  }

  async createPixelUri(props: CreateTrackingPixelProps): Promise<PixelUrl> {
    return {
      pixelUid: '123',
      uri: `https://`
    }
    // const trackingPixels = await this.gateway.getTrackingPixels(props.internalTrackingId)
    // return {
    //   pixelUid: trackingPixels.pixelUids[0],
    //   uri: `https://${trackingPixels.domain}/${this.uriPaidContentIndicator}/${trackingPixels.pixelUids[0]}`
    // }
  }
}
