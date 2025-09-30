import { TrackingPixelProviderType } from '@prisma/client';
import { PixelUrl, TrackingPixelProvider } from '../tracking-pixel-provider';
import { GatewayClient } from './client-gateway';
import { InternalKey } from './internalKey';
import { HttpService } from '@nestjs/axios';

type ProLitterisInternal = {
  username?: never;
  password?: never;

  usePublisherInternalKey: true;
  publisherInternalKeyDomain: string;
};

type ProLitterisGateway = {
  publisherInternalKeyDomain?: never;

  usePublisherInternalKey: false;
  username: string;
  password: string;
};

export type ProLitterisCountPixelProps = {
  username?: string;
  password?: string;
  memberNr: string;
  publisherInternalKeyDomain?: string;
  usePublisherInternalKey: boolean;
  onlyPaidContentAccess: boolean;
};

export class ProlitterisTrackingPixelProvider implements TrackingPixelProvider {
  private gateway =
    this.props.usePublisherInternalKey ?
      new InternalKey(
        this.props.memberNr,
        this.props.publisherInternalKeyDomain
      )
    : new GatewayClient(
        this.props.memberNr,
        this.props.username,
        this.props.password,
        this.httpClient
      );
  private uriPaidContentIndicator =
    this.props.onlyPaidContentAccess ? 'pw' : 'na';

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: TrackingPixelProviderType,
    private props: ProLitterisCountPixelProps &
      (ProLitterisInternal | ProLitterisGateway),
    private httpClient: HttpService
  ) {}

  async createPixelUri(internalTrackingId: string): Promise<PixelUrl> {
    const trackingPixels =
      await this.gateway.getTrackingPixels(internalTrackingId);

    return {
      pixelUid: trackingPixels.pixelUids[0],
      uri: `https://${trackingPixels.domain}/${this.uriPaidContentIndicator}/${trackingPixels.pixelUids[0]}`,
    };
  }
}
