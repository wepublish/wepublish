import styled from '@emotion/styled';
import { PeriodicJobsLog } from '@wepublish/membership/editor';
import {
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Nav } from 'rsuite';

import { OneMessages } from '../../oneMessages/oneMessages';
import { ChangelogDashboard } from '../dashboard/changelogDashboard';

enum NotificationsTab {
  WhatsNew = 'whatsNew',
  TeamMessages = 'teamMessages',
  JobLogs = 'jobLogs',
}

const Tabs = styled(Nav)`
  margin-top: 20px;
`;

const TabContent = styled.div`
  padding: 20px 4px;
`;

export function NotificationsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<NotificationsTab>(
    NotificationsTab.WhatsNew
  );

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('dashboard.notifications')}</h2>
        </ListViewHeader>
      </ListViewContainer>

      <Tabs
        appearance="tabs"
        activeKey={activeTab}
        onSelect={activeKey => setActiveTab(activeKey as NotificationsTab)}
      >
        <Nav.Item eventKey={NotificationsTab.WhatsNew}>
          {t('changelog.whatsNew')}
        </Nav.Item>

        <Nav.Item eventKey={NotificationsTab.TeamMessages}>
          {t('oneMessages.header')}
        </Nav.Item>

        <PermissionControl qualifyingPermissions={['CAN_GET_PERIODIC_JOB_LOG']}>
          <Nav.Item eventKey={NotificationsTab.JobLogs}>
            {t('periodicJobsLog.title')}
          </Nav.Item>
        </PermissionControl>
      </Tabs>

      <TabContent>
        {activeTab === NotificationsTab.WhatsNew && (
          <ChangelogDashboard
            take={10}
            paginated
          />
        )}

        {activeTab === NotificationsTab.TeamMessages && (
          <OneMessages
            hideHeader
            emptyMessage={t('notifications.noTeamMessages')}
          />
        )}

        {activeTab === NotificationsTab.JobLogs && (
          <PermissionControl
            qualifyingPermissions={['CAN_GET_PERIODIC_JOB_LOG']}
          >
            <PeriodicJobsLog take={20} />
          </PermissionControl>
        )}
      </TabContent>
    </>
  );
}
