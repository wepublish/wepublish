import styled from '@emotion/styled';
import {
  Alert,
  AlertTitle,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import { FullTrackingPixelFragment } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';

export interface TrackingPixelsProps {
  trackingPixels: (FullTrackingPixelFragment | null)[] | undefined;
}

const MessageWithMarginBottom = styled(Alert)`
  margin-bottom: 20px;
`;

export default function TrackingPixels({
  trackingPixels,
}: TrackingPixelsProps) {
  const { t } = useTranslation();

  if (!trackingPixels?.length) {
    return (
      <Alert severity="info">
        <AlertTitle>{t('trackingPixels.noPixelInfoHeader')}</AlertTitle>

        {t('trackingPixels.noPixelInfoDescription')}
      </Alert>
    );
  }

  return (
    <>
      {trackingPixels.map((trackingPixel, trackingPixelIndex) => {
        if (trackingPixel) {
          return (
            <Card
              variant="outlined"
              key={`tracking-pixel-${trackingPixelIndex}`}
            >
              <CardHeader
                title={
                  <h6>
                    {
                      trackingPixel.trackingPixelMethod
                        .trackingPixelProviderType
                    }
                  </h6>
                }
              />

              <CardContent>
                {!!trackingPixel.error && (
                  <MessageWithMarginBottom severity="error">
                    <AlertTitle>{t('trackingPixels.errorHeader')}</AlertTitle>

                    {trackingPixel.error}
                  </MessageWithMarginBottom>
                )}
                <p>
                  {t('trackingPixels.providerId')}{' '}
                  {trackingPixel.trackingPixelMethod.trackingPixelProviderID}
                </p>

                <p>
                  {t('trackingPixels.trackingId')} {trackingPixel.pixelUid}
                </p>

                <p>
                  {t('trackingPixels.trackingURI')} {trackingPixel.uri}
                </p>
              </CardContent>
            </Card>
          );
        }
      })}
    </>
  );
}
