import { Alert, AlertTitle, Box } from '@mui/material';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { describeConflict, EngagementConflict } from './engagement-conflicts';

/** The rules a rule competes with, and which one readers get. */
export const EngagementConflictNotice = ({
  conflicts,
  children,
}: {
  conflicts: EngagementConflict[];
  children?: ReactNode;
}) => {
  const { t } = useTranslation();

  if (!conflicts.length) {
    return null;
  }

  return (
    <Alert
      severity="warning"
      data-testid="conflicts"
    >
      <AlertTitle>{t('engagement.conflict.title')}</AlertTitle>

      <Box
        component="ul"
        sx={{ m: 0, pl: 2.5 }}
      >
        {conflicts.map(conflict => (
          <li key={conflict.rule.id ?? conflict.rule.name}>
            {describeConflict(conflict, t)}
          </li>
        ))}
      </Box>

      {children}
    </Alert>
  );
};
