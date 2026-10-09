import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface ConfirmActionModalProps {
  title: string;
  message: ReactNode;
  loading?: boolean;
  onConfirm(): void;
  onClose(): void;
}

export function ConfirmActionModal({
  title,
  message,
  loading,
  onConfirm,
  onClose,
}: ConfirmActionModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      fullWidth
      open
      onClose={onClose}
      maxWidth="sm"
      role="alertdialog"
    >
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>{message}</DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          loading={loading}
          onClick={onConfirm}
        >
          {t('confirm')}
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
