import {PublicTrackingPixelFragment} from '@wepublish/website/api'

interface ArticleTrackingPixelsProps {
  trackingPixels?: (PublicTrackingPixelFragment | null)[] | null
}

export default function ArticleTrackingPixels({trackingPixels}: ArticleTrackingPixelsProps) {
  // no valid tracking pixel
  if (!trackingPixels?.find(trackingPixel => !!trackingPixel?.uri)) {
    return
  }

  return (
    <>
      {trackingPixels.map(trackingPixel => {
        if (trackingPixel?.uri) {
          return <img src={trackingPixel.uri} width="1" height="1" alt="tracking-pixel" />
        }
      })}
    </>
  )
}
