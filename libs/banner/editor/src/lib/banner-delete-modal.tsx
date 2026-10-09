import { useMutation } from '@apollo/client/react';
import {
  DeleteBannerDocument,
  FullBannerFragment,
} from '@wepublish/editor/api';
import { humanizeError, enqueueSnackbar } from '@wepublish/ui/editor';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

type DeleteBannerProps = {
  banner: FullBannerFragment | undefined;
  onClose(): void;
  onDelete(): Promise<unknown>;
};

const onErrorToast = (error: Error) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

const onCompletedToast = (t: TFunction) => () => {
  enqueueSnackbar(t('toast.deletedSuccess'), {
    variant: 'success',
    autoHideDuration: 3000,
  });
};

export function BannerDeleteModal({
  banner,
  onClose,
  onDelete,
}: DeleteBannerProps) {
  const { t } = useTranslation();

  const [deleteBannerMutation] = useMutation(DeleteBannerDocument, {
    onError: onErrorToast,
    onCompleted: onCompletedToast(t),
  });

  async function deleteBanner() {
    if (!banner) {
      return;
    }

    await deleteBannerMutation({
      variables: {
        id: banner.id,
      },
    });

    onClose();
    onDelete();
  }

  return (
    <Dialog
      open={!!banner}
      onClose={onClose}
    >
      <DialogTitle>{t('banner.delete.title')}</DialogTitle>

      <DialogContent>
        {t('banner.delete.body', {
          name: banner?.title,
        })}
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          onClick={deleteBanner}
          color="error"
        >
          {t('banner.delete.delete')}
        </Button>

        <Button
          variant="text"
          onClick={onClose}
        >
          {t('cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
