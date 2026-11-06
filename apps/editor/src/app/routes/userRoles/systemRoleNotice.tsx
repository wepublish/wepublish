import { Alert } from '@mui/material';
import { createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';

export const SystemRoleContext = createContext(false);

export function SystemRoleNotice() {
  const { t } = useTranslation();
  const systemRole = useContext(SystemRoleContext);

  return systemRole ?
      <Alert severity="info">{t('userRoles.panels.systemRole')}</Alert>
    : null;
}
