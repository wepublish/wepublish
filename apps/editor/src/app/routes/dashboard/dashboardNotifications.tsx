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

export function DashboardNotifications() {
  const { t } = useTranslation();

  return (
    <Section>
      <OneMessages />

      <ChangelogActionRequired />

      <PermissionControl qualifyingPermissions={['CAN_GET_PERIODIC_JOB_LOG']}>
        <Group>
          <GroupHeader>{t('periodicJobsLog.title')}</GroupHeader>
          <PeriodicJobsLog />
        </Group>
      </PermissionControl>

      <Group>
        <GroupHeader>{t('changelog.whatsNew')}</GroupHeader>
        <ChangelogDashboard />
      </Group>
    </Section>
  );
}
