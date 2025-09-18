import styled from '@emotion/styled';
import { FullTrackingPixelFragment } from '@wepublish/editor/api-v2';
import { useTranslation } from 'react-i18next';
import { Message, Panel } from 'rsuite';

export interface TrackingPixelsProps {
  trackingPixels: (FullTrackingPixelFragment | null)[] | undefined;
}

const MessageWithMarginBottom = styled(Message)`
  margin-bottom: 20px;
`;

export default function TrackingPixels({
  trackingPixels,
}: TrackingPixelsProps) {
  const { t } = useTranslation();

  if (!trackingPixels?.length) {
    return (
      <Message
        type="info"
        showIcon
        header={<strong>{t('trackingPixels.noPixelInfoHeader')}</strong>}
      >
        {t('trackingPixels.noPixelInfoDescription')}
      </Message>
    );
  }

  return (
    <>
      {trackingPixels.map((trackingPixel, trackingPixelIndex) => {
        if (trackingPixel) {
          return (
            <Panel
              key={`tracking-pixel-${trackingPixelIndex}`}
              header={
                <h6>
                  {trackingPixel.trackingPixelMethod.trackingPixelProviderType}
                </h6>
              }
              bordered
            >
              {!!trackingPixel.error && (
                <MessageWithMarginBottom
                  type="error"
                  showIcon
                  header={<strong>{t('trackingPixels.errorHeader')}</strong>}
                >
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
            </Panel>
          );
        }
      })}
    </>
  );
}
