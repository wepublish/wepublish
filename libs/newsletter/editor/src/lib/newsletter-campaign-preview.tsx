import styled from '@emotion/styled';
import { useNewsletterCampaignPreviewQuery } from '@wepublish/editor/api';
import { createCheckedPermissionComponent } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

export const PreviewFrame = styled.iframe`
  display: block;
  width: 100%;
  height: 100vh;
  border: 0;
`;

/**
 * The stored issue as Mailchimp would receive it.
 *
 * Sandboxed without `allow-scripts` and without `allow-same-origin`: the frame
 * gets an opaque origin, so whatever the HTML holds can neither run nor reach
 * the editor's session token. Popups stay allowed, so the mail's links open in
 * a new tab as they would in an inbox.
 */
function NewsletterCampaignPreview() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const { data, error } = useNewsletterCampaignPreviewQuery({
    variables: { id },
  });

  if (error) {
    return <p>{error.message}</p>;
  }

  if (!data) {
    return <p>{t('newsletter.editor.loading')}</p>;
  }

  return (
    <PreviewFrame
      title={t('newsletter.editor.preview')}
      sandbox="allow-popups allow-popups-to-escape-sandbox"
      srcDoc={data.newsletterCampaignPreview}
    />
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_NEWSLETTER_CAMPAIGNS',
])(NewsletterCampaignPreview);
export { CheckedPermissionComponent as NewsletterCampaignPreview };
