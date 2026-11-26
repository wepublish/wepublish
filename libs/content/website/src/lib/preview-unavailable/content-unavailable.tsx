import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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
          <H5 component="h1">{t('preview.contentUnavailableTitle')}</H5>

          <Paragraph>{t('preview.contentUnavailableText')}</Paragraph>
        </PreviewUnavailableWrapper>
      : <PreviewUnavailable />}
    </>
  );
}
