import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface NetworkContentPeerInfoDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NetworkContentPeerInfoDialog({
  open,
  onClose,
}: NetworkContentPeerInfoDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
    >
      <DialogTitle>{t('networkContentDashboard.peerInfoTitle')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          {t('networkContentDashboard.peerInfoText')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('networkContentDashboard.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
