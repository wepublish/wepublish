import { useMutation } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { DeleteGateDocument } from '@wepublish/editor/api';
import { enqueueSnackbar, humanizeError } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';

export type GateDeleteTexts = {
  title: string;
  body: string;
  confirm: string;
};

type GateDeleteModalProps = {
  gate: { id: string } | undefined;
  texts: GateDeleteTexts | undefined;
  onClose(): void;
  onDelete(): Promise<unknown> | void;
};

export function GateDeleteModal({
  gate,
  texts,
  onClose,
  onDelete,
}: GateDeleteModalProps) {
  const { t } = useTranslation();

  const [deleteGate] = useMutation(DeleteGateDocument, {
    onError: error =>
      enqueueSnackbar(humanizeError(error), {
        variant: 'error',
        autoHideDuration: 8000,
      }),
    onCompleted: () =>
      enqueueSnackbar(t('toast.deletedSuccess'), {
        variant: 'success',
        autoHideDuration: 3000,
      }),
  });

  const confirm = async () => {
    if (!gate) {
      return;
    }

    await deleteGate({ variables: { id: gate.id } });

    onClose();
    await onDelete();
  };

  return (
    <Dialog
      open={!!gate}
      onClose={onClose}
    >
      <DialogTitle>{texts?.title}</DialogTitle>

      <DialogContent>{texts?.body}</DialogContent>

      <DialogActions>
        <Button
          variant="text"
          onClick={onClose}
        >
          {t('cancel')}
        </Button>

        <Button
          variant="contained"
          onClick={confirm}
          color="error"
        >
          {texts?.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
