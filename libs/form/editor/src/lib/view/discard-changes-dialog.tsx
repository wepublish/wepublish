import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

export type DiscardChangesDialogProps = {
  readonly open: boolean;
  readonly onKeep: () => void;
  readonly onDiscard: () => void;
};

export function DiscardChangesDialog({
  open,
  onKeep,
  onDiscard,
}: DiscardChangesDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onKeep}
    >
      <DialogTitle>{t('form.view.discardChanges.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('form.view.discardChanges.body')}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant="text"
          onClick={onKeep}
        >
          {t('form.view.discardChanges.keep')}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onDiscard}
        >
          {t('form.view.discardChanges.discard')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
