import { Alert, AlertTitle, Box } from '@mui/material';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { describeConflict, EngagementConflict } from './engagement-conflicts';

const ConflictList = ({ conflicts }: { conflicts: EngagementConflict[] }) => {
  const { t } = useTranslation();

  return (
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
  );
};

/**
 * The rules a rule competes with, and which one readers get. A warning while
 * the order is left to chance, only an info once a rule is set to show first.
 * `children` go with the warning, or the info when there is none.
 */
export const EngagementConflictNotice = ({
  conflicts,
  children,
}: {
  conflicts: EngagementConflict[];
  children?: ReactNode;
}) => {
  const { t } = useTranslation();
  const open = conflicts.filter(({ settled }) => !settled);
  const settled = conflicts.filter(({ settled }) => settled);

  return (
    <>
      {open.length > 0 && (
        <Alert
          severity="warning"
          data-testid="conflicts"
        >
          <AlertTitle>{t('engagement.conflict.title')}</AlertTitle>
          <ConflictList conflicts={open} />
          {children}
        </Alert>
      )}

      {settled.length > 0 && (
        <Alert
          severity="info"
          data-testid="conflicts-settled"
        >
          <AlertTitle>{t('engagement.conflict.settledTitle')}</AlertTitle>
          <ConflictList conflicts={settled} />
          {!open.length && children}
        </Alert>
      )}
    </>
  );
};
