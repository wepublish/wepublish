import {
  Button,
  ButtonProps,
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
  confirmLabel?: string;
  confirmColor?: ButtonProps['color'];
  onConfirm(): void;
  onClose(): void;
}

export function ConfirmActionModal({
  title,
  message,
  loading,
  confirmLabel,
  confirmColor,
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
          variant="text"
          onClick={onClose}
        >
          {t('cancel')}
        </Button>

        <Button
          variant="contained"
          color={confirmColor}
          loading={loading}
          onClick={onConfirm}
        >
          {confirmLabel ?? t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
