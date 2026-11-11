import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { issueState, type IssueState } from './common';

const STATE_COLOR: Record<
  IssueState,
  'default' | 'primary' | 'success' | 'info'
> = {
  open: 'default',
  exported: 'primary',
  closed: 'success',
  historic: 'info',
};

export function PrintIssueStatusChip({
  issue,
}: {
  issue: Parameters<typeof issueState>[0];
}) {
  const { t } = useTranslation();
  const state = issueState(issue);

  return (
    <Chip
      size="small"
      color={STATE_COLOR[state]}
      label={t(`printIssues.status.${state}`)}
    />
  );
}
