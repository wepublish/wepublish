import { TrackingPixelProviderType } from '@prisma/client';

export interface TrackingPixelProvider {
  id: string;
  createPixelUri(internalTrackingId: string): Promise<PixelUrl>;
  getTrackingPixelType(): Promise<TrackingPixelProviderType>;
  initDatabaseConfiguration(
    id: string,
    type: TrackingPixelProviderType
  ): Promise<void>;
}

export type PixelUrl = {
  pixelUid: string;
  uri: string;
};
