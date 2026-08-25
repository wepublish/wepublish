import styled from '@emotion/styled';
import { PeriodicJobsLog } from '@wepublish/membership/editor';
import { PermissionControl } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';

import { OneMessages } from '../../oneMessages/oneMessages';
import {
  ChangelogActionRequired,
  ChangelogDashboard,
} from './changelogDashboard';

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

// Compact variant for the dashboard: one uniform stack with only what needs
// attention right now, plus the latest changelog entries. Sources are told
// apart by tags; the full history lives on /notifications. Entries shown as
// action-required notifications are excluded from the recent list below so
// nothing appears twice.
export function DashboardNotifications() {
  const { t } = useTranslation();

  return (
    <Section>
      <OneMessages
        hideHeader
        sourceTag={t('notifications.sourceTeam')}
      />

      <ChangelogActionRequired sourceTag={t('notifications.sourceChangelog')} />

      <PermissionControl qualifyingPermissions={['CAN_GET_PERIODIC_JOB_LOG']}>
        <PeriodicJobsLog
          onlyProblems
          sourceTag={t('notifications.sourceJobLogs')}
        />
      </PermissionControl>

      <ChangelogDashboard
        take={3}
        hideUnconfirmedActionRequired
        sourceTag={t('notifications.sourceChangelog')}
      />
    </Section>
  );
}
