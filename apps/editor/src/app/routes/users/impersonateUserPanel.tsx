import { useMutation, useQuery } from '@apollo/client/react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  CreateWebsiteImpersonationDocument,
  CurrentSessionDocument,
  FullUserFragment,
  ImpersonateUserDocument,
} from '@wepublish/editor/api';
import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { startEditorImpersonation } from '../../impersonation';
import { startPreviewHandshake } from '../../openPreview';

type Target = 'editor' | 'website';

type ImpersonateUserPanelProps = {
  user: Pick<
    FullUserFragment,
    'id' | 'email' | 'active' | 'managedByWepublishLogin' | 'roles'
  >;
  openWindow?: () => Window | null;
};

export function ImpersonateUserPanel({
  user,
  openWindow = () => window.open('', '_blank'),
}: ImpersonateUserPanelProps) {
  const { t } = useTranslation();
  const { data } = useQuery(CurrentSessionDocument);
  const [impersonateUser] = useMutation(ImpersonateUserDocument);
  const [createWebsiteImpersonation] = useMutation(
    CreateWebsiteImpersonationDocument
  );

  const [target, setTarget] = useState<Target | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  if (
    !data?.currentSession.canImpersonate ||
    user.managedByWepublishLogin ||
    !user.active
  ) {
    return null;
  }

  const mayUseEditor = user.roles.some(role =>
    role.permissions.some(permission => permission.id === 'CAN_LOGIN_EDITOR')
  );

  const close = () => {
    setTarget(null);
    setReason('');
  };

  const variables = () => ({ userId: user.id, reason: reason.trim() });

  const inEditor = async () => {
    setBusy(true);

    try {
      const response = await impersonateUser({ variables: variables() });
      const token = response.data?.impersonateUser.token;

      if (!token) {
        throw new Error('No session');
      }

      startEditorImpersonation(token);
    } catch {
      setBusy(false);
      setError(t('impersonation.failed'));
      close();
    }
  };

  const onWebsite = async () => {
    const website = openWindow();

    if (!website) {
      setError(t('impersonation.popupBlocked'));
      close();
      return;
    }

    setBusy(true);

    try {
      const mint = async () =>
        (await createWebsiteImpersonation({ variables: variables() })).data
          ?.createWebsiteImpersonation;

      const first = await mint();

      if (!first) {
        throw new Error('No grant');
      }

      let firstToken: string | null = first.token;

      website.location.href = first.url;
      startPreviewHandshake(website, first.url, {
        createToken: async () => {
          const token = firstToken ?? (await mint())?.token;
          firstToken = null;

          return token;
        },
      });
    } catch {
      website.close();
      setError(t('impersonation.failed'));
    } finally {
      setBusy(false);
      close();
    }
  };

  const canConfirm = !busy && reason.trim().length >= 3;

  const confirm = (event: FormEvent) => {
    event.preventDefault();

    if (!canConfirm) {
      return;
    }

    if (target === 'editor') {
      inEditor();
    } else {
      onWebsite();
    }
  };

  return (
    <Card>
      <CardHeader title={t('impersonation.title')} />
      <CardContent>
        <Stack spacing={2}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {t('impersonation.info')}
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <Stack
            direction="row"
            spacing={1}
          >
            {mayUseEditor && (
              <Button
                variant="outlined"
                onClick={() => setTarget('editor')}
              >
                {t('impersonation.editor')}
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={() => setTarget('website')}
            >
              {t('impersonation.website')}
            </Button>
          </Stack>
        </Stack>
      </CardContent>

      <Dialog
        open={!!target}
        onClose={close}
        fullWidth
      >
        <DialogTitle>
          {t('impersonation.dialogTitle', { email: user.email })}
        </DialogTitle>
        <form onSubmit={confirm}>
          <DialogContent>
            <TextField
              label={t('impersonation.reason')}
              helperText={t('impersonation.reasonHelp')}
              value={reason}
              onChange={event => setReason(event.target.value)}
              autoFocus
              fullWidth
              margin="dense"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={close}>{t('impersonation.cancel')}</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!canConfirm}
            >
              {t('impersonation.confirm')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Card>
  );
}
