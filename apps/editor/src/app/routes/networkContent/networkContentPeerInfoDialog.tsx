import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { WepOneClient, WepOneUser } from './networkContent.types';

function isInternalUser(user: WepOneUser): boolean {
  return !!user?.email && user?.email.endsWith('@wepublish.ch');
}

function getExternalUsers(client: WepOneClient): WepOneUser[] {
  return (client.allowedUsers ?? [])
    .map(entry => entry.directus_users_id)
    .filter(user => !isInternalUser(user));
}

interface NetworkContentPeerInfoDialogProps {
  client: WepOneClient | null;
  onClose: () => void;
}

export function NetworkContentPeerInfoDialog({
  client,
  onClose,
}: NetworkContentPeerInfoDialogProps) {
  const { t } = useTranslation();
  const externalUsers = client ? getExternalUsers(client) : [];

  return (
    <Dialog
      open={!!client}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      {client && (
        <>
          <DialogTitle>
            {t('networkContentPage.contactTitle', { name: client.name })}
          </DialogTitle>
          <DialogContent>
            <Typography
              variant="body2"
              sx={{ mb: 2 }}
            >
              {t('networkContentPage.contactText')}
            </Typography>

            {externalUsers.length > 0 ?
              externalUsers.map((user, idx) => {
                const name = [user?.first_name, user?.last_name]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <Typography
                    key={idx}
                    variant="body2"
                    sx={{ py: 0.5 }}
                  >
                    <strong>
                      {name || t('networkContentPage.unknownUser')}
                    </strong>
                    {user?.email && (
                      <>
                        {' — '}
                        <a href={`mailto:${encodeURIComponent(user?.email)}`}>
                          {user?.email}
                        </a>
                      </>
                    )}
                  </Typography>
                );
              })
            : <Typography
                variant="body2"
                color="textSecondary"
              >
                {t('networkContentPage.noContacts')}
              </Typography>
            }
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>
              {t('networkContentDashboard.close')}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
