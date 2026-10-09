import { useMutation } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  DeleteCommentDocument,
  FullCommentFragment,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdDelete } from 'react-icons/md';

import { humanizeError } from '../../humanizeError';
import { enqueueSnackbar } from '../../snackbar';
import { PermissionControl } from '../permissionControl';

const onErrorToast = (error: Error) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

interface CommentDeleteBtnProps {
  comment?: FullCommentFragment;
  onCommentDeleted?(): void;
}

export function CommentDeleteBtn({
  comment,
  onCommentDeleted,
}: CommentDeleteBtnProps) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const [deleteComment, { loading }] = useMutation(DeleteCommentDocument, {
    onCompleted: () => {
      setModalOpen(false);
      if (onCommentDeleted) {
        onCommentDeleted();
      }
    },
    onError: error => {
      setModalOpen(false);
      onErrorToast(error);
    },
  });

  if (!comment) {
    return;
  }

  return (
    <>
      <PermissionControl qualifyingPermissions={['CAN_DELETE_COMMENTS']}>
        <Button
          variant="outlined"
          startIcon={<MdDelete />}
          color="error"
          onClick={() => setModalOpen(true)}
          loading={loading}
        >
          {t('delete')}
        </Button>
      </PermissionControl>

      <Dialog open={modalOpen}>
        <DialogTitle>{t('commentDeleteBtn.modalTitle')}</DialogTitle>
        <DialogContent>{t('commentDeleteBtn.modalBody')}</DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            color="error"
            onClick={async () => {
              await deleteComment({
                variables: {
                  deleteCommentId: comment.id,
                },
              });
            }}
            loading={loading}
          >
            {t('delete')}
          </Button>
          <Button
            variant="contained"
            onClick={() => setModalOpen(false)}
            loading={loading}
          >
            {t('cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
