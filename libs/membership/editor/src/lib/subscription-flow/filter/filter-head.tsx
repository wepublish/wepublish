import { TableCell } from '@mui/material';
import { useTranslation } from 'react-i18next';

export function FilterHead() {
  const { t } = useTranslation();

  return (
    <>
      <TableCell align="center">
        <strong>{t('subscriptionFlow.memberplan')}</strong>
      </TableCell>

      <TableCell align="center">
        <strong>{t('subscriptionFlow.paymentMethod')}</strong>
      </TableCell>

      <TableCell align="center">
        <strong>{t('subscriptionFlow.periodicity')}</strong>
      </TableCell>

      <TableCell align="center">
        <strong>{t('subscriptionFlow.autoRenewal')}</strong>
      </TableCell>
    </>
  );
}
