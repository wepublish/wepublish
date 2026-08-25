import styled from '@emotion/styled';
import {
  NotificationSource,
  useMarkNotificationReadMutation,
  useNotificationReadsQuery,
} from '@wepublish/editor/api';
import { PeriodicJobsLog } from '@wepublish/membership/editor';
import { PermissionControl } from '@wepublish/ui/editor';
import { useCallback, useMemo } from 'react';
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

const EMPTY_SET: ReadonlySet<string> = new Set();

// Compact variant for the dashboard: one uniform stack with only what needs
// attention right now, plus the latest changelog entries. Sources are told
// apart by tags; the full history lives on /notifications. Items can be marked
// as read per user (the X), which hides them here but not in the archive.
// Entries shown as action-required notifications are excluded from the recent
// list below so nothing appears twice.
export function DashboardNotifications() {
  const { t } = useTranslation();

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
    <Section>
      <OneMessages
        hideHeader
        sourceTag={t('notifications.sourceTeam')}
        readItemIds={
          readItemIds.get(NotificationSource.OneMessage) ?? EMPTY_SET
        }
        onMarkRead={markRead(NotificationSource.OneMessage)}
      />

      <ChangelogActionRequired sourceTag={t('notifications.sourceChangelog')} />

      <PermissionControl qualifyingPermissions={['CAN_GET_PERIODIC_JOB_LOG']}>
        <PeriodicJobsLog
          onlyProblems
          sourceTag={t('notifications.sourceJobLogs')}
          readItemIds={
            readItemIds.get(NotificationSource.PeriodicJob) ?? EMPTY_SET
          }
          onMarkRead={markRead(NotificationSource.PeriodicJob)}
        />
      </PermissionControl>

      <ChangelogDashboard
        take={3}
        hideUnconfirmedActionRequired
        sourceTag={t('notifications.sourceChangelog')}
        readEntryIds={
          readItemIds.get(NotificationSource.Changelog) ?? EMPTY_SET
        }
        onMarkRead={markRead(NotificationSource.Changelog)}
      />
    </Section>
  );
}
