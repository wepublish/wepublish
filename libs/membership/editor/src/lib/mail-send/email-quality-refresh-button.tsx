import { useMutation } from '@apollo/client/react';
import { RefreshEmailQualityDocument } from '@wepublish/editor/api';
import { humanizeError } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdRefresh } from 'react-icons/md';
import { Button, Message, toaster } from 'rsuite';

/**
 * Pulls late delivery states from the mail provider and re-evaluates every
 * email level. The nightly job does the same; this is for the moment a media
 * looks at a campaign's result and plans the next pass.
 */
export function EmailQualityRefreshButton({
  size = 'sm',
  onDone,
}: {
  size?: 'xs' | 'sm';
  onDone?: () => void;
}) {
  const { t } = useTranslation();
  const [refresh, { loading }] = useMutation(RefreshEmailQualityDocument, {
    onError: error =>
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
        >
          {humanizeError(error)}
        </Message>
      ),
    onCompleted: ({ refreshEmailQuality }) => {
      toaster.push(
        <Message
          type="success"
          showIcon
          closable
          duration={6000}
        >
          {t('mailSend.emailSegments.refreshed', refreshEmailQuality)}
        </Message>
      );
      onDone?.();
    },
  });

  return (
    <Button
      size={size}
      appearance="ghost"
      loading={loading}
      startIcon={<MdRefresh />}
      onClick={() => refresh()}
    >
      {t(
        loading ?
          'mailSend.emailSegments.refreshing'
        : 'mailSend.emailSegments.refresh'
      )}
    </Button>
  );
}
