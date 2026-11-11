import { useMutation } from '@apollo/client/react';
import { Button } from '@mui/material';
import { RefreshEmailQualityDocument } from '@wepublish/editor/api';
import { enqueueSnackbar, humanizeError } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdRefresh } from 'react-icons/md';

/**
 * Pulls late delivery states from the mail provider and re-evaluates every
 * email level. The nightly job does the same; this is for the moment a media
 * looks at a campaign's result and plans the next pass.
 */
export function EmailQualityRefreshButton({
  size = 'small',
  onDone,
}: {
  size?: 'small' | 'medium';
  onDone?: () => void;
}) {
  const { t } = useTranslation();
  const [refresh, { loading }] = useMutation(RefreshEmailQualityDocument, {
    onError: error =>
      enqueueSnackbar(humanizeError(error), { variant: 'error' }),
    onCompleted: ({ refreshEmailQuality }) => {
      enqueueSnackbar(
        t('mailSend.emailSegments.refreshed', refreshEmailQuality),
        { variant: 'success', autoHideDuration: 6000 }
      );
      onDone?.();
    },
  });

  return (
    <Button
      size={size}
      variant="outlined"
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
