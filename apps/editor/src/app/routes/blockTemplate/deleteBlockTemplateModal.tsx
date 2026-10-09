import { useMutation } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  BlockTemplate,
  DeleteBlockTemplateDocument,
} from '@wepublish/editor/api';
import { enqueueSnackbar, humanizeError } from '@wepublish/ui/editor';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

type DeleteBlockTemplateModalProps = {
  blockTemplate: BlockTemplate | undefined;
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

export function DeleteBlockTemplateModal({
  blockTemplate,
  onClose,
  onDelete,
}: DeleteBlockTemplateModalProps) {
  const { t } = useTranslation();

  const [deleteBlockTemplateMutation] = useMutation(
    DeleteBlockTemplateDocument,
    {
      onError: onErrorToast,
      onCompleted: onCompletedToast(t),
    }
  );

  async function deleteBlockTemplate() {
    if (!blockTemplate) {
      return;
    }

    await deleteBlockTemplateMutation({
      variables: {
        id: blockTemplate.id,
      },
    });

    onClose();
    onDelete();
  }

  return (
    <Dialog
      open={!!blockTemplate}
      onClose={onClose}
    >
      <DialogTitle>{t('deleteBlockTemplateModal.title')}</DialogTitle>

      <DialogContent>
        {t('deleteBlockTemplateModal.body', {
          name: blockTemplate?.name,
        })}
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          onClick={deleteBlockTemplate}
          color="error"
        >
          {t('deleteBlockTemplateModal.deleteBtn')}
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
