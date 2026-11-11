import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Badge,
  Button,
  IconButton,
  List,
  ListItemButton,
  Popover,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ChangelogEntriesDocument,
  ChangelogSeverity,
  MarkNotificationReadDocument,
  NotificationReadsDocument,
  NotificationSource,
} from '@wepublish/editor/api';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdNotificationsNone } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

import { useChangelogDialogs } from '../changelogDashboard';

/**
 * DRAFT 2 — informational changelog entries leave the dashboard list and wait
 * behind a bell in the dashboard's top bar. The badge counts what the user
 * hasn't opened yet; opening an entry marks it read for that user.
 */
const PopoverHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(1.5, 2, 0.5)};
`;

const Row = styled.span`
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr);
  column-gap: ${({ theme }) => theme.spacing(1.5)};
  align-items: baseline;
  width: 100%;
`;

const UnreadDot = styled.span<{ unread: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  align-self: center;
  background: ${({ theme, unread }) =>
    unread ? theme.vars.palette.primary.main : 'transparent'};
`;

const Title = styled.span<{ unread: boolean }>`
  font-weight: ${({ unread }) => (unread ? 600 : 400)};
`;

const Date = styled.span`
  grid-column: 2;
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const Empty = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing(2)};
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: ${({ theme }) => theme.spacing(0.5, 1)};
  border-top: 1px solid ${({ theme }) => theme.vars.palette.divider};
`;

export function ChangelogBell() {
  const { t, i18n } = useTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);

  const { data } = useQuery(ChangelogEntriesDocument, {
    fetchPolicy: 'cache-and-network',
    variables: {
      take: 20,
      filter: { severities: [ChangelogSeverity.Info] },
      locale: i18n.language,
    },
  });
  const { data: readData } = useQuery(NotificationReadsDocument, {
    fetchPolicy: 'cache-and-network',
  });
  const [markNotificationRead] = useMutation(MarkNotificationReadDocument, {
    refetchQueries: ['NotificationReads'],
  });

  const markRead = (itemId: string) =>
    markNotificationRead({
      variables: { source: NotificationSource.Changelog, itemId },
    });

  const readIds = useMemo(
    () =>
      new Set(
        (readData?.notificationReads ?? [])
          .filter(read => read.source === NotificationSource.Changelog)
          .map(read => read.itemId)
      ),
    [readData?.notificationReads]
  );

  const { overlay, showDetails } = useChangelogDialogs({
    onDetailsOpen: entry => {
      if (!readIds.has(entry.id)) {
        markRead(entry.id);
      }
    },
  });

  const entries = data?.changelogEntries.nodes ?? [];
  const unread = entries.filter(entry => !readIds.has(entry.id));
  const dayFormat = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'short',
  });

  return (
    <>
      <Tooltip title={t('changelog.bell.title')}>
        <IconButton
          aria-label={t('changelog.bell.unread', { count: unread.length })}
          onClick={event => setAnchor(event.currentTarget)}
        >
          <Badge
            color="primary"
            badgeContent={unread.length}
            max={9}
          >
            <MdNotificationsNone />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 380, maxWidth: '100vw' } } }}
      >
        <PopoverHeader>
          <Typography
            variant="h3"
            component="h2"
          >
            {t('changelog.bell.title')}
          </Typography>

          {!!unread.length && (
            <Button
              size="small"
              onClick={() => unread.forEach(entry => markRead(entry.id))}
            >
              {t('changelog.bell.markAllRead')}
            </Button>
          )}
        </PopoverHeader>

        {entries.length ?
          <List
            dense
            sx={{ maxHeight: 420, overflowY: 'auto' }}
          >
            {entries.map(entry => {
              const isUnread = !readIds.has(entry.id);

              return (
                <ListItemButton
                  key={entry.id}
                  onClick={() => {
                    close();
                    showDetails(entry);
                  }}
                >
                  <Row>
                    <UnreadDot unread={isUnread} />
                    <Title unread={isUnread}>{entry.title}</Title>
                    <Date>
                      {dayFormat.format(new globalThis.Date(entry.releasedAt))}
                    </Date>
                  </Row>
                </ListItemButton>
              );
            })}
          </List>
        : <Empty>{t('changelog.noEntries')}</Empty>}

        <Footer>
          <Button
            size="small"
            component={RouterLink}
            to="/notifications"
          >
            {t('changelog.bell.showAll')}
          </Button>
        </Footer>
      </Popover>

      {overlay}
    </>
  );
}
