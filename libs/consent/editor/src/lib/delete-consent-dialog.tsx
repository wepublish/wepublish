import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type DeleteConsentDialogProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose(): void;
  onConfirm(): void;
};

export function DeleteConsentDialog({
  open,
  title,
  children,
  onClose,
  onConfirm,
}: DeleteConsentDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>{children}</DialogContent>

      <DialogActions>
        <Button
          variant="text"
          onClick={onClose}
        >
          {t('cancel')}
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
        >
          {t('delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
