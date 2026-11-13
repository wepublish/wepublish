import { useQuery } from '@apollo/client/react';
import { Alert, Button, Stack } from '@mui/material';
import { WepublishLoginDocument } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { startWepublishLogin } from './wepublishLogin';

export function WepublishLoginButton({
  navigate = url => window.location.assign(url),
}: {
  navigate?: (url: string) => void;
}) {
  const { t } = useTranslation();
  const { data } = useQuery(WepublishLoginDocument);
  const [starting, setStarting] = useState(false);
  const [failed, setFailed] = useState(false);

  const client = data?.wepublishLogin;

  if (!client) {
    return null;
  }

  const start = async () => {
    setStarting(true);
    setFailed(false);

    try {
      navigate(
        await startWepublishLogin({ client, origin: window.location.origin })
      );
    } catch {
      setStarting(false);
      setFailed(true);
    }
  };

  return (
    <Stack
      spacing={1}
      sx={{ alignItems: 'flex-end' }}
    >
      {failed && (
        <Alert severity="error">{t('login.wepublish.unavailable')}</Alert>
      )}
      <Button
        variant="text"
        size="small"
        color="inherit"
        disabled={starting}
        onClick={start}
        sx={{ color: 'text.secondary' }}
      >
        {t('login.wepublish.button')}
      </Button>
    </Stack>
  );
}
