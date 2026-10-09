import { useMutation } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { DeleteEventDocument, FullEventFragment } from '@wepublish/editor/api';
import { enqueueSnackbar, humanizeError } from '@wepublish/ui/editor';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

type DeleteEventProps = {
  event: FullEventFragment | undefined;
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

export function DeleteEventModal({
  event,
  onClose,
  onDelete,
}: DeleteEventProps) {
  const { t } = useTranslation();

  const [deleteEventMutation] = useMutation(DeleteEventDocument);

  async function deleteEvent() {
    if (!event) {
      return;
    }

    await deleteEventMutation({
      variables: {
        id: event.id,
      },
      onError: onErrorToast,
      onCompleted: onCompletedToast(t),
    });

    onClose();
    onDelete();
  }

  return (
    <Dialog
      open={!!event}
      onClose={onClose}
    >
      <DialogTitle>{t('event.delete.title')}</DialogTitle>

      <DialogContent>
        {t('event.delete.body', {
          name: event?.name,
        })}
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          onClick={deleteEvent}
          color="error"
        >
          {t('event.delete.delete')}
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
