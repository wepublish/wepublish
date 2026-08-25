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
  gap: 20px;
`;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const GroupHeader = styled.h5`
  margin: 0;
`;

// Compact variant for the dashboard: only what needs attention right now, plus
// the latest changelog entries. The full history lives on /notifications.
export function DashboardNotifications() {
  const { t } = useTranslation();

  return (
    <Section>
      <OneMessages />

      <ChangelogActionRequired />

      <PermissionControl qualifyingPermissions={['CAN_GET_PERIODIC_JOB_LOG']}>
        <PeriodicJobsLog onlyProblems />
      </PermissionControl>

      <Group>
        <GroupHeader>{t('changelog.whatsNew')}</GroupHeader>
        <ChangelogDashboard take={3} />
      </Group>
    </Section>
  );
}
