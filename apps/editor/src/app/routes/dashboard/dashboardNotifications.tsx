import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Button, Card, CardContent, CardHeader } from '@mui/material';
import {
  MarkNotificationReadDocument,
  NotificationReadsDocument,
  NotificationSource,
} from '@wepublish/editor/api';
import { usePeriodicJobNotifications } from '@wepublish/membership/editor';
import { CanGetPeriodicJobLog } from '@wepublish/permissions';
import { NotificationSeverity, useHasPermission } from '@wepublish/ui/editor';
import { cloneElement, ReactElement, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdChevronRight } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

import { useOneMessageNotifications } from '../../oneMessages/oneMessages';
import {
  useChangelogActionNotifications,
  useChangelogNewsNotifications,
} from './changelogDashboard';
import { selectDashboardNotifications } from './dashboardNotificationSelection';
import { useOneChannelNotifications } from './oneChannelAlert';

// Every source renders its own stack of notification items. Dissolving those
// stacks puts all items into this one flex column, where the `order` each
// NotificationItem carries sorts them by severity across sources — so a failing
// job is never pushed below a changelog entry by the order the sources happen
// to be rendered in.
const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MoreHint = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
`;

type Item = ReactElement<{
  severity: NotificationSeverity;
  compact?: boolean;
}>;

const EMPTY_SET: ReadonlySet<string> = new Set();

const JOB_LOG_PERMISSION = [CanGetPeriodicJobLog.id];

/**
 * Every source contributes its notifications to ONE list, which is then sorted
 * by severity: a failing job belongs above a piece of news no matter which
 * source happens to be asked first. Rendering source after source, as this
 * panel used to, let an orange changelog task sit above a red outage.
 *
 * The dashboard only has room for a few of them: every source keeps its most
 * severe item, only the first is shown with its body, and a link says how many
 * more wait on the notifications page.
 *
 * The whole panel is hidden while nothing has anything to show. The sources
 * keep fetching meanwhile, so a new message or a job that starts failing
 * brings it back.
 */
export function DashboardNotifications() {
  const { t } = useTranslation();

  const { data } = useQuery(NotificationReadsDocument, {
    fetchPolicy: 'cache-and-network',
  });
  const [markNotificationRead] = useMutation(MarkNotificationReadDocument, {
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

  const mayReadJobLogs = useHasPermission(JOB_LOG_PERMISSION);

  const connector = useOneChannelNotifications({
    sourceTag: t('notifications.sourceConnector'),
  });

  const team = useOneMessageNotifications({
    hideHeader: true,
    sourceTag: t('notifications.sourceTeam'),
    readItemIds: readItemIds.get(NotificationSource.OneMessage) ?? EMPTY_SET,
    onMarkRead: markRead(NotificationSource.OneMessage),
  });

  const actionRequired = useChangelogActionNotifications({
    sourceTag: t('notifications.sourceChangelog'),
  });

  const jobs = usePeriodicJobNotifications({
    onlyProblems: true,
    skip: !mayReadJobLogs,
    sourceTag: t('notifications.sourceJobLogs'),
  });

  const news = useChangelogNewsNotifications({
    take: 3,
    hideUnconfirmedActionRequired: true,
    hideEmptyState: true,
    sourceTag: t('notifications.sourceChangelog'),
    readEntryIds: readItemIds.get(NotificationSource.Changelog) ?? EMPTY_SET,
    onMarkRead: markRead(NotificationSource.Changelog),
  });

  const { visible, hiddenCount } = useMemo(
    () =>
      selectDashboardNotifications([
        { category: 'connector', items: connector as Item[] },
        { category: 'team', items: team as Item[] },
        {
          category: 'changelog',
          items: [...actionRequired.items, ...news.items] as Item[],
        },
        { category: 'jobs', items: (mayReadJobLogs ? jobs : []) as Item[] },
      ]),
    [connector, team, actionRequired.items, jobs, mayReadJobLogs, news.items]
  );

  return (
    <Card
      variant="outlined"
      hidden={!visible.length}
    >
      <CardHeader
        title={t('dashboard.notifications')}
        slotProps={{ title: { variant: 'h2' } }}
        action={
          <Button
            component={RouterLink}
            to="/notifications"
            variant="text"
            endIcon={<MdChevronRight />}
          >
            {t('dashboard.showAllNotifications')}
          </Button>
        }
      />

      <CardContent>
        <Section>
          {visible.map((item, index) =>
            index ? cloneElement(item, { compact: true }) : item
          )}
        </Section>

        {hiddenCount > 0 && (
          <MoreHint>
            <Button
              component={RouterLink}
              to="/notifications"
              variant="text"
              endIcon={<MdChevronRight />}
            >
              {t('dashboard.moreNotifications', { count: hiddenCount })}
            </Button>
          </MoreHint>
        )}

        {actionRequired.overlay}
        {news.overlay}
      </CardContent>
    </Card>
  );
}
