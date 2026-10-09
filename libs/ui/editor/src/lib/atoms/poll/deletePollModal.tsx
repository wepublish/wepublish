import { useMutation } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { DeletePollDocument, FullPollFragment } from '@wepublish/editor/api';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { humanizeError } from '../../humanizeError';
import { enqueueSnackbar } from '../../snackbar';

interface DeletePollProps {
  poll?: FullPollFragment;
  onClose(): void;
  onDelete(): Promise<unknown>;
}

/**
 * Error handling
 */
const onErrorToast = (error: Error) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

const onCompletedToast = (t: TFunction) => () => {
  enqueueSnackbar(t('pollList.pollDeleted'), {
    variant: 'success',
    autoHideDuration: 3000,
  });
};

export function DeletePollModal({ poll, onClose, onDelete }: DeletePollProps) {
  const { t } = useTranslation();

  const [deletePollMutation] = useMutation(DeletePollDocument);

  /**
   * FUNCTIONS
   */
  async function deletePoll() {
    if (!poll) {
      return;
    }

    // call api
    await deletePollMutation({
      variables: {
        deletePollId: poll.id,
      },
      onError: onErrorToast,
      onCompleted: onCompletedToast(t),
    });

    onClose();
    onDelete();
  }

  return (
    <Dialog
      open={!!poll}
      onClose={onClose}
    >
      <DialogTitle>{t('deletePollModal.title')}</DialogTitle>

      <DialogContent>
        {t('deletePollModal.body', {
          pollQuestion: poll?.question || t('pollList.noQuestion'),
        })}
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          onClick={deletePoll}
          color="error"
        >
          {t('deletePollModal.deleteBtn')}
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
