import { FullTrackingPixelFragment } from '@wepublish/website/api';

export type ArticleTrackingPixelsProps = {
  trackingPixels?: (FullTrackingPixelFragment | null)[] | null;
};

export const ArticleTrackingPixels = ({
  trackingPixels,
}: ArticleTrackingPixelsProps) => (
  <>
    {trackingPixels?.map(trackingPixel => {
      if (trackingPixel?.uri) {
        return (
          <img
            key={trackingPixel.uri}
            src={trackingPixel.uri}
            width="1"
            height="1"
            alt="tracking pixel"
          />
        );
      }

      return null;
    })}
  </>
);
