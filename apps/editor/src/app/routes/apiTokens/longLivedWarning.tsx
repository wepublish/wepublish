import { Alert } from '@mui/material';
import type { FormValues } from '@wepublish/form/editor';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  type apiTokenSchema,
  RECOMMENDED_LIFETIME_YEARS,
  yearsFromNow,
} from './apiToken.schema';

export function LongLivedWarning() {
  const { t } = useTranslation();
  const expiresAt = useWatch<FormValues<typeof apiTokenSchema>, 'expiresAt'>({
    name: 'expiresAt',
  });
  const longLived =
    expiresAt instanceof Date &&
    expiresAt > yearsFromNow(RECOMMENDED_LIFETIME_YEARS);

  return longLived ?
      <Alert severity="warning">
        {t('apiTokenList.panels.longLivedWarning')}
      </Alert>
    : null;
}
