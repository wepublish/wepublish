import styled from '@emotion/styled';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
  TypographyProps,
  useTheme,
} from '@mui/material';
import { format, isAfter, isToday, isYesterday, Locale } from 'date-fns';
import { de, enUS, fr } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdHistory, MdPerson, MdRestore, MdVisibility } from 'react-icons/md';

import { StatePill, stateTextColors } from '../atoms/statePill';
import {
  DRAWER_WIDTHS,
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { paletteColor } from '../paletteColor';
import { StateColor } from '../utility';

const DATE_LOCALES: Record<string, Locale> = {
  en: enUS,
  de,
  fr,
};

export interface VersionHistoryAuthor {
  name?: string | null;
  firstName?: string | null;
}

export interface VersionHistoryRevision {
  id: string;
  createdAt: string;
  publishedAt?: string | null;
  archivedAt?: string | null;
  title?: string | null;
  subtitle?: string | null;
  author?: VersionHistoryAuthor | null;
}

export function getAuthorName(author?: VersionHistoryAuthor | null) {
  if (!author) {
    return null;
  }

  return [author.firstName, author.name].filter(Boolean).join(' ') || null;
}

function getAuthorInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');
}

export type RevisionState =
  'published' | 'pending' | 'draft' | 'archived' | 'superseded';

export interface VersionHistoryProps {
  open: boolean;
  onClose: () => void;
  revisions: VersionHistoryRevision[];
  draftId?: string | null;
  pendingId?: string | null;
  publishedId?: string | null;
  loading?: boolean;
  restoringId?: string | null;
  canRestore?: boolean;
  totalCount?: number;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  onRestore: (revisionId: string) => void | Promise<void>;
  onPreview?: (revisionId: string) => void;
}

const Day = styled('section')`
  & + & {
    margin-top: ${({ theme }) => theme.spacing(3)};
  }
`;

const DayHeading = styled((props: TypographyProps) => (
  <Typography
    variant="overline"
    component="h3"
    {...props}
  />
))`
  margin-bottom: ${({ theme }) => theme.spacing(1)};
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const Timeline = styled('ol')`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const TimelineItem = styled('li')`
  position: relative;
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(1.5)};

  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 5px;
    width: 2px;
    background-color: ${({ theme }) => theme.vars.palette.divider};
  }

  &:first-of-type::before {
    top: 18px;
  }

  &:last-of-type::before {
    bottom: calc(100% - 18px);
  }

  &:only-of-type::before {
    display: none;
  }
`;

const Dot = styled('span')<{ dotColor: string; isCurrent: boolean }>`
  position: relative;
  z-index: 1;
  width: 12px;
  height: 12px;
  margin-top: 12px;
  border-radius: 50%;
  background-color: ${({ dotColor }) => dotColor};
  box-shadow: 0 0 0 3px
    ${({ theme, isCurrent }) =>
      isCurrent ?
        `rgba(${theme.vars.palette.primary.mainChannel} / 0.3)`
      : theme.vars.palette.background.paper};
`;

const Entry = styled('div')<{ isCurrent: boolean }>`
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.5)};
  margin-bottom: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(1, 1.5)};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme, isCurrent }) =>
    isCurrent ?
      `rgba(${theme.vars.palette.primary.mainChannel} / 0.08)`
    : 'transparent'};
`;

const EntryHeader = styled('div')`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  min-height: 24px;
`;

const Meta = styled('div')`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.75)};
  min-width: 0;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const Actions = styled('div')`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.25)};
  margin: -4px -6px -4px auto;
`;

const EmptyState = styled('div')`
  display: grid;
  justify-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  padding: ${({ theme }) => theme.spacing(6, 2)};
  text-align: center;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const stateColors: Record<RevisionState, StateColor> = {
  published: StateColor.published,
  pending: StateColor.pending,
  draft: StateColor.draft,
  superseded: StateColor.none,
  archived: StateColor.none,
};

export function getRevisionState(
  revision: VersionHistoryRevision,
  ids: {
    draftId?: string | null;
    pendingId?: string | null;
    publishedId?: string | null;
  },
  now: Date = new Date()
): RevisionState {
  if (revision.id === ids.publishedId) {
    return 'published';
  }

  if (revision.id === ids.pendingId) {
    return 'pending';
  }

  if (revision.id === ids.draftId) {
    return 'draft';
  }

  if (revision.archivedAt) {
    return 'archived';
  }

  if (revision.publishedAt && !isAfter(new Date(revision.publishedAt), now)) {
    return 'superseded';
  }

  return 'archived';
}

export function VersionHistory({
  open,
  onClose,
  revisions,
  draftId,
  pendingId,
  publishedId,
  loading = false,
  restoringId,
  canRestore = true,
  totalCount,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  onRestore,
  onPreview,
}: VersionHistoryProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [pendingRestore, setPendingRestore] =
    useState<VersionHistoryRevision | null>(null);

  const dateLocale = useMemo(
    () => DATE_LOCALES[i18n.language] ?? enUS,
    [i18n.language]
  );

  const stateLabel: Record<RevisionState, string> = {
    published: t('versionHistory.state.published'),
    pending: t('versionHistory.state.pending'),
    draft: t('versionHistory.state.draft'),
    superseded: t('versionHistory.state.superseded'),
    archived: t('versionHistory.state.archived'),
  };

  const formatDate = (value: string) =>
    format(new Date(value), 'dd MMM yyyy, HH:mm', { locale: dateLocale });

  const formatDay = (value: string) => {
    const date = new Date(value);

    if (isToday(date)) {
      return t('versionHistory.today');
    }

    if (isYesterday(date)) {
      return t('versionHistory.yesterday');
    }

    return format(date, 'EEEE, d MMMM yyyy', { locale: dateLocale });
  };

  const days = revisions.reduce<
    {
      day: string;
      entries: { revision: VersionHistoryRevision; showTitle: boolean }[];
    }[]
  >((groups, revision, index) => {
    const day = formatDay(revision.createdAt);
    const showTitle =
      index === 0 || revisions[index - 1].title !== revision.title;
    const entry = { revision, showTitle };
    const last = groups[groups.length - 1];

    if (last?.day === day) {
      last.entries.push(entry);
    } else {
      groups.push({ day, entries: [entry] });
    }

    return groups;
  }, []);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            display: 'flex',
            flexDirection: 'column',
            width: DRAWER_WIDTHS.xs,
            maxWidth: '100vw',
          },
        },
      }}
    >
      <DrawerHeader>
        <div>
          <DrawerTitle>{t('versionHistory.title')}</DrawerTitle>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            {t('versionHistory.subtitle', {
              count: totalCount ?? revisions.length,
            })}
          </Typography>
        </div>

        <DrawerActions>
          <Button
            variant="text"
            onClick={onClose}
          >
            {t('versionHistory.close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody>
        {loading && (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {[0, 1, 2].map(key => (
              <Skeleton
                key={key}
                variant="rounded"
                height={72}
              />
            ))}
          </Box>
        )}

        {!loading && revisions.length === 0 && (
          <EmptyState>
            <MdHistory size={40} />
            <Typography>{t('versionHistory.empty')}</Typography>
          </EmptyState>
        )}

        {!loading &&
          days.map(({ day, entries }) => (
            <Day key={day}>
              <DayHeading>{day}</DayHeading>

              <Timeline>
                {entries.map(({ revision, showTitle }) => {
                  const state = getRevisionState(revision, {
                    draftId,
                    pendingId,
                    publishedId,
                  });
                  const isCurrent =
                    revision.id === draftId ||
                    revision.id === pendingId ||
                    revision.id === publishedId;
                  const isDraft = revision.id === draftId;
                  const restorable = canRestore && !isDraft;
                  const authorName = getAuthorName(revision.author);

                  return (
                    <TimelineItem key={revision.id}>
                      <Dot
                        dotColor={paletteColor(
                          theme,
                          stateTextColors[stateColors[state]]
                        )}
                        isCurrent={isCurrent}
                      />

                      <Entry isCurrent={isCurrent}>
                        <EntryHeader>
                          <Tooltip title={formatDate(revision.createdAt)}>
                            <Typography
                              variant="subtitle2"
                              component="span"
                            >
                              {format(new Date(revision.createdAt), 'HH:mm', {
                                locale: dateLocale,
                              })}
                            </Typography>
                          </Tooltip>

                          <StatePill
                            state={stateColors[state]}
                            size="small"
                          >
                            {stateLabel[state]}
                          </StatePill>

                          {isCurrent && !restorable && (
                            <Typography
                              variant="caption"
                              color="primary"
                              sx={{ ml: 'auto' }}
                            >
                              {t('versionHistory.currentVersion')}
                            </Typography>
                          )}

                          {((onPreview && !isDraft) || restorable) && (
                            <Actions>
                              {onPreview && !isDraft && (
                                <Tooltip title={t('versionHistory.preview')}>
                                  <IconButton
                                    size="small"
                                    aria-label={t('versionHistory.preview')}
                                    onClick={() => onPreview(revision.id)}
                                  >
                                    <MdVisibility />
                                  </IconButton>
                                </Tooltip>
                              )}

                              {restorable && (
                                <Tooltip title={t('versionHistory.restore')}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      aria-label={t('versionHistory.restore')}
                                      disabled={!!restoringId}
                                      onClick={() =>
                                        setPendingRestore(revision)
                                      }
                                    >
                                      {restoringId === revision.id ?
                                        <CircularProgress size={16} />
                                      : <MdRestore />}
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )}
                            </Actions>
                          )}
                        </EntryHeader>

                        {showTitle && (
                          <Typography variant="body2">
                            {revision.title || t('versionHistory.untitled')}
                          </Typography>
                        )}

                        {showTitle && revision.subtitle && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {revision.subtitle}
                          </Typography>
                        )}

                        <Meta>
                          <Avatar
                            sx={{
                              width: 20,
                              height: 20,
                              fontSize: 10,
                              bgcolor: 'action.selected',
                              color: 'text.secondary',
                            }}
                          >
                            {authorName ?
                              getAuthorInitials(authorName)
                            : <MdPerson size={12} />}
                          </Avatar>

                          <Typography
                            variant="caption"
                            noWrap
                            sx={{ flexShrink: 0 }}
                          >
                            {authorName ?? t('versionHistory.unknownAuthor')}
                          </Typography>

                          {revision.publishedAt && (
                            <Typography
                              variant="caption"
                              noWrap
                            >
                              · {formatDate(revision.publishedAt)}
                            </Typography>
                          )}
                        </Meta>
                      </Entry>
                    </TimelineItem>
                  );
                })}
              </Timeline>
            </Day>
          ))}

        {!loading && hasMore && (
          <Box sx={{ display: 'grid', justifyItems: 'center', gap: 1, pt: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              disabled={loadingMore}
              startIcon={
                loadingMore ? <CircularProgress size={14} /> : undefined
              }
              onClick={() => onLoadMore?.()}
            >
              {t('versionHistory.loadMore')}
            </Button>

            {totalCount != null && (
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {t('versionHistory.showing', {
                  count: revisions.length,
                  total: totalCount,
                })}
              </Typography>
            )}
          </Box>
        )}
      </DrawerBody>

      <Dialog
        open={!!pendingRestore}
        onClose={() => setPendingRestore(null)}
      >
        <DialogTitle>{t('versionHistory.confirm.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('versionHistory.confirm.message', {
              date: pendingRestore ? formatDate(pendingRestore.createdAt) : '',
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingRestore(null)}>
            {t('versionHistory.confirm.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (pendingRestore) {
                const id = pendingRestore.id;
                setPendingRestore(null);
                await onRestore(id);
              }
            }}
          >
            {t('versionHistory.confirm.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}
