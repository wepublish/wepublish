import { Alert } from '@mui/material';
import { ExternalAppApiTokenFragment } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';

import { apiKeyStatus } from './apiKeyStatus';

type ApiKeyWarningProps = {
  apiToken?: ExternalAppApiTokenFragment | null;
};

/** Says when an app's API key runs out or no longer works; nothing otherwise. */
export function ApiKeyWarning({ apiToken }: ApiKeyWarningProps) {
  const { t } = useTranslation();
  const status = apiKeyStatus(apiToken);

  if (!apiToken || !status || status === 'ok') {
    return null;
  }

  return (
    <Alert severity={status === 'expiresSoon' ? 'warning' : 'error'}>
      {t(`externalApps.apiKey.${status}`, {
        name: apiToken.name,
        expiresAt: new Date(apiToken.expiresAt),
      })}
    </Alert>
  );
}
