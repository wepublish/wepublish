import styled from '@emotion/styled';
import { Tab, Tabs } from '@mui/material';
import { PeriodicJobsLog } from '@wepublish/membership/editor';
import { CanGetPeriodicJobLog } from '@wepublish/permissions';
import {
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
  useAuthorisation,
  PageTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { OneMessages } from '../../oneMessages/oneMessages';
import { ChangelogDashboard } from '../dashboard/changelogDashboard';

enum NotificationsTab {
  WhatsNew = 'whatsNew',
  TeamMessages = 'teamMessages',
  JobLogs = 'jobLogs',
}

const TabContent = styled.div`
  padding: 20px 4px;
`;

const tabId = (tab: NotificationsTab) => `notifications-tab-${tab}`;
const panelId = (tab: NotificationsTab) => `notifications-panel-${tab}`;

export function NotificationsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<NotificationsTab>(
    NotificationsTab.WhatsNew
  );
  const canSeeJobLogs = useAuthorisation(CanGetPeriodicJobLog.id);

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('dashboard.notifications')}</PageTitle>
        </ListViewHeader>
      </ListViewContainer>

      <Tabs
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        value={activeTab}
        onChange={(_event, activeKey) =>
          setActiveTab(activeKey as NotificationsTab)
        }
      >
        <Tab
          value={NotificationsTab.WhatsNew}
          id={tabId(NotificationsTab.WhatsNew)}
          aria-controls={panelId(NotificationsTab.WhatsNew)}
          label={t('changelog.whatsNew')}
        />

        <Tab
          value={NotificationsTab.TeamMessages}
          id={tabId(NotificationsTab.TeamMessages)}
          aria-controls={panelId(NotificationsTab.TeamMessages)}
          label={t('oneMessages.header')}
        />

        {canSeeJobLogs && (
          <Tab
            value={NotificationsTab.JobLogs}
            id={tabId(NotificationsTab.JobLogs)}
            aria-controls={panelId(NotificationsTab.JobLogs)}
            label={t('periodicJobsLog.title')}
          />
        )}
      </Tabs>

      <TabContent
        role="tabpanel"
        id={panelId(activeTab)}
        aria-labelledby={tabId(activeTab)}
      >
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
          <PermissionControl qualifyingPermissions={[CanGetPeriodicJobLog.id]}>
            <PeriodicJobsLog take={20} />
          </PermissionControl>
        )}
      </TabContent>
    </>
  );
}
