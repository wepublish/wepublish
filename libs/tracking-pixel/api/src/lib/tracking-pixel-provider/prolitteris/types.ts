export type ReturnTrackingPixels = {
  domain: string;
  pixelUids: string[];
};

export interface ProLitterisGenerator {
  getTrackingPixels(internalTrackingId: string): Promise<ReturnTrackingPixels>;
}
