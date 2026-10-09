import { useMutation } from '@apollo/client/react';
import {
  DeleteCrowdfundingDocument,
  FullCrowdfundingFragment,
} from '@wepublish/editor/api';
import { humanizeError, enqueueSnackbar } from '@wepublish/ui/editor';
import { TFunction } from 'i18next';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

type DeleteCrowdfundingProps = {
  crowdfunding: FullCrowdfundingFragment | undefined;
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

export function CrowdfundingDeleteModal({
  crowdfunding,
  onClose,
  onDelete,
}: DeleteCrowdfundingProps) {
  const { t } = useTranslation();

  const [deleteCrowdfundingMutation] = useMutation(DeleteCrowdfundingDocument, {
    onError: onErrorToast,
    onCompleted: onCompletedToast(t),
  });

  async function deleteCrowdfunding() {
    if (!crowdfunding) {
      return;
    }

    await deleteCrowdfundingMutation({
      variables: {
        id: crowdfunding.id,
      },
    });

    onClose();
    onDelete();
  }

  return (
    <Dialog
      open={!!crowdfunding}
      onClose={onClose}
    >
      <DialogTitle>{t('crowdfunding.delete.title')}</DialogTitle>

      <DialogContent>
        {t('crowdfunding.delete.body', {
          name: crowdfunding?.name,
        })}
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          onClick={deleteCrowdfunding}
          color="error"
        >
          {t('crowdfunding.delete.delete')}
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
