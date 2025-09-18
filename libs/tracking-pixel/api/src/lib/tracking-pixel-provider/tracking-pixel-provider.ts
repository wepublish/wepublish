import { TrackingPixelProviderType } from '@prisma/client';

export interface TrackingPixelProvider {
  id: string;
  name: string;
  type: TrackingPixelProviderType;
  createPixelUri(internalTrackingId: string): Promise<PixelUrl>;
}

export type PixelUrl = {
  pixelUid: string;
  uri: string;
};
