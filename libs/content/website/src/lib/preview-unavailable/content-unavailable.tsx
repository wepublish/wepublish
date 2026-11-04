import { useWebsiteBuilder } from '@wepublish/website/builder';

import {
  PreviewUnavailable,
  PreviewUnavailableWrapper,
} from './preview-unavailable';
import { usePreviewAuthState } from './use-preview-auth-state';

export function ContentUnavailable() {
  const { mounted, previewRequested, previewModeStored, sessionAuthPossible } =
    usePreviewAuthState();
  const {
    elements: { H5, Paragraph },
  } = useWebsiteBuilder();

  const mayPreview =
    previewRequested || previewModeStored || sessionAuthPossible;

  return (
    <>
      <meta
        name="robots"
        content="noindex"
      />

      {mounted && !mayPreview ?
        <PreviewUnavailableWrapper>
          <H5 component="h1">Dieser Inhalt ist nicht verf&uuml;gbar</H5>

          <Paragraph>
            Er wurde entfernt oder ist noch nicht ver&ouml;ffentlicht.
          </Paragraph>
        </PreviewUnavailableWrapper>
      : <PreviewUnavailable />}
    </>
  );
}
