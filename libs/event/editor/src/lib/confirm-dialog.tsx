import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
} from '@mui/material';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  busy?: boolean;
  error?: ReactNode;
  onConfirm(): void;
  onClose(): void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  busy,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={open}
      onClose={onClose}
    >
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          {!error && <DialogContentText>{body}</DialogContentText>}
          {error && (
            <Alert
              severity="error"
              role="alert"
            >
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          variant="text"
          onClick={onClose}
        >
          {t('cancel')}
        </Button>

        {!error && (
          <Button
            variant="contained"
            color="error"
            disabled={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
