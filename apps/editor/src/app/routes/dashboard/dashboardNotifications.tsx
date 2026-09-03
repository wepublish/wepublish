import styled from '@emotion/styled';
import {
  NotificationSource,
  useMarkNotificationReadMutation,
  useNotificationReadsQuery,
} from '@wepublish/editor/api';
import { PeriodicJobsLog } from '@wepublish/membership/editor';
import {
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
} from '@wepublish/ui/editor';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdChevronRight } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Button, Panel } from 'rsuite';

import { OneMessages } from '../../oneMessages/oneMessages';
import {
  ChangelogActionRequired,
  ChangelogDashboard,
} from './changelogDashboard';

const NotificationsPanel = styled(Panel)`
  margin-bottom: 12px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const EMPTY_SET: ReadonlySet<string> = new Set();

// Compact variant for the dashboard: one uniform stack with only what needs
// attention right now, plus the latest changelog entries. Sources are told
// apart by tags; the full history lives on /notifications. Items can be marked
// as read per user, which hides them here but not in the archive. Entries
// shown as action-required notifications are excluded from the recent list
// below so nothing appears twice.
//
// The whole panel is hidden while no source has anything to show. The sources
// stay mounted meanwhile so they keep fetching and can bring the panel back
// (a new team message, a job that starts failing).
export function DashboardNotifications() {
  const { t } = useTranslation();

  const [hasTeamMessages, setHasTeamMessages] = useState(false);
  const [hasActionRequired, setHasActionRequired] = useState(false);
  const [hasJobProblems, setHasJobProblems] = useState(false);
  const [hasRecentEntries, setHasRecentEntries] = useState(false);

  const hasNotifications =
    hasTeamMessages || hasActionRequired || hasJobProblems || hasRecentEntries;

  const { data } = useNotificationReadsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [markNotificationRead] = useMarkNotificationReadMutation({
    refetchQueries: ['NotificationReads'],
  });

  const readItemIds = useMemo(() => {
    const bySource = new Map<NotificationSource, Set<string>>();

    for (const read of data?.notificationReads ?? []) {
      if (!bySource.has(read.source)) {
        bySource.set(read.source, new Set());
      }

      bySource.get(read.source)?.add(read.itemId);
    }

    return bySource;
  }, [data?.notificationReads]);

  const markRead = useCallback(
    (source: NotificationSource) => (itemId: string) => {
      markNotificationRead({ variables: { source, itemId } });
    },
    [markNotificationRead]
  );

  return (
    <NotificationsPanel
      hidden={!hasNotifications}
      header={
        <ListViewContainer>
          <ListViewHeader>
            <h2>{t('dashboard.notifications')}</h2>
          </ListViewHeader>

          <ListViewActions>
            <Link to="/notifications">
              <Button
                appearance="primary"
                endIcon={<MdChevronRight />}
              >
                {t('dashboard.showAllNotifications')}
              </Button>
            </Link>
          </ListViewActions>
        </ListViewContainer>
      }
      bordered
    >
      <Section>
        <OneMessages
          hideHeader
          sourceTag={t('notifications.sourceTeam')}
          readItemIds={
            readItemIds.get(NotificationSource.OneMessage) ?? EMPTY_SET
          }
          onMarkRead={markRead(NotificationSource.OneMessage)}
          onVisibilityChange={setHasTeamMessages}
        />

        <ChangelogActionRequired
          sourceTag={t('notifications.sourceChangelog')}
          onVisibilityChange={setHasActionRequired}
        />

        <PermissionControl qualifyingPermissions={['CAN_GET_PERIODIC_JOB_LOG']}>
          <PeriodicJobsLog
            onlyProblems
            teamConfirm
            sourceTag={t('notifications.sourceJobLogs')}
            onVisibilityChange={setHasJobProblems}
          />
        </PermissionControl>

        <ChangelogDashboard
          take={3}
          hideUnconfirmedActionRequired
          hideEmptyState
          sourceTag={t('notifications.sourceChangelog')}
          readEntryIds={
            readItemIds.get(NotificationSource.Changelog) ?? EMPTY_SET
          }
          onMarkRead={markRead(NotificationSource.Changelog)}
          onVisibilityChange={setHasRecentEntries}
        />
      </Section>
    </NotificationsPanel>
  );
}
