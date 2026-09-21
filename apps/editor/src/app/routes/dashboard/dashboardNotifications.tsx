import styled from '@emotion/styled';
import {
  NotificationSource,
  useMarkNotificationReadMutation,
  useNotificationReadsQuery,
} from '@wepublish/editor/api';
import { usePeriodicJobNotifications } from '@wepublish/membership/editor';
import {
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  NotificationSeverity,
  SEVERITY_ORDER,
  useHasPermission,
} from '@wepublish/ui/editor';
import { ReactElement, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdChevronRight } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Button, Panel } from 'rsuite';

import { useOneMessageNotifications } from '../../oneMessages/oneMessages';
import {
  useChangelogActionNotifications,
  useChangelogNewsNotifications,
} from './changelogDashboard';
import { useOneChannelNotifications } from './oneChannelAlert';

const NotificationsPanel = styled(Panel)`
  margin-bottom: 12px;
`;

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

const EMPTY_SET: ReadonlySet<string> = new Set();

const JOB_LOG_PERMISSION = ['CAN_GET_PERIODIC_JOB_LOG'];

/**
 * Every source contributes its notifications to ONE list, which is then sorted
 * by severity: a failing job belongs above a piece of news no matter which
 * source happens to be asked first. Rendering source after source, as this
 * panel used to, let an orange changelog task sit above a red outage.
 *
 * The whole panel is hidden while nothing has anything to show. The sources
 * keep fetching meanwhile, so a new message or a job that starts failing
 * brings it back.
 */
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

  const items = useMemo<ReactElement<{ severity: NotificationSeverity }>[]>(
    () =>
      (
        [
          ...connector,
          ...team,
          ...actionRequired.items,
          ...(mayReadJobLogs ? jobs : []),
          ...news.items,
        ] as ReactElement<{ severity: NotificationSeverity }>[]
      ).sort(
        (a, b) =>
          SEVERITY_ORDER[a.props.severity] - SEVERITY_ORDER[b.props.severity]
      ),
    [connector, team, actionRequired.items, jobs, mayReadJobLogs, news.items]
  );

  return (
    <NotificationsPanel
      hidden={!items.length}
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
      <Section>{items}</Section>

      {actionRequired.overlay}
      {news.overlay}
    </NotificationsPanel>
  );
}
