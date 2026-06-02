import styled from '@emotion/styled';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import { format, formatDistanceToNow, isAfter, Locale } from 'date-fns';
import { de, enUS, fr } from 'date-fns/locale';
import { ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdArchive,
  MdClose,
  MdEdit,
  MdHistory,
  MdPublic,
  MdRestore,
  MdSchedule,
  MdVisibility,
} from 'react-icons/md';

const DATE_LOCALES: Record<string, Locale> = {
  en: enUS,
  de,
  fr,
};

/**
 * A single revision as needed to render the version history. Both article and
 * page revisions can be mapped to this shape.
 */
export interface VersionHistoryRevision {
  id: string;
  createdAt: string;
  publishedAt?: string | null;
  archivedAt?: string | null;
  title?: string | null;
  subtitle?: string | null;
}

export type RevisionState =
  | 'published'
  | 'pending'
  | 'draft'
  | 'archived'
  | 'superseded';

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
  onRestore: (revisionId: string) => void | Promise<void>;
  onPreview?: (revisionId: string) => void;
}

const DrawerContent = styled.div`
  width: 480px;
  max-width: 100vw;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
`;

const HeaderIcon = styled.div`
  font-size: 26px;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.palette.primary.main};
`;

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px 32px;
`;

const Timeline = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const TimelineItem = styled.li`
  position: relative;
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 16px;
  padding-bottom: 20px;

  &:last-of-type .timeline-connector {
    display: none;
  }
`;

const Rail = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Dot = styled.div<{ dotColor: string }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: #fff;
  background-color: ${({ dotColor }) => dotColor};
  flex-shrink: 0;
  z-index: 1;
`;

const Connector = styled.div`
  flex: 1;
  width: 2px;
  margin-top: 2px;
  background-color: ${({ theme }) => theme.palette.divider};
`;

const Card = styled.div<{ isCurrent: boolean }>`
  border: 1px solid
    ${({ isCurrent, theme }) =>
      isCurrent ? theme.palette.primary.main : theme.palette.divider};
  border-radius: 8px;
  padding: 12px 14px;
  background: ${({ theme }) => theme.palette.background.paper};
  transition: border-color 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.palette.primary.light};
  }
`;

const CardTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
`;

const RevisionTitle = styled(Typography)`
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  color: ${({ theme }) => theme.palette.text.secondary};
  padding: 48px 16px;
`;

const stateMeta: Record<
  RevisionState,
  { color: 'success' | 'info' | 'warning' | 'default'; hex: string }
> = {
  published: { color: 'success', hex: '#2e7d32' },
  pending: { color: 'info', hex: '#0288d1' },
  draft: { color: 'warning', hex: '#ed6c02' },
  superseded: { color: 'default', hex: '#78909c' },
  archived: { color: 'default', hex: '#90a4ae' },
};

const stateIcon: Record<RevisionState, ReactElement> = {
  published: <MdPublic />,
  pending: <MdSchedule />,
  draft: <MdEdit />,
  superseded: <MdPublic />,
  archived: <MdArchive />,
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

  // A revision that was published in the past but is no longer the live one.
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
  onRestore,
  onPreview,
}: VersionHistoryProps) {
  const { t, i18n } = useTranslation();
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

  const formatRelative = (value: string) =>
    formatDistanceToNow(new Date(value), {
      locale: dateLocale,
      addSuffix: true,
    });

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
    >
      <DrawerContent>
        <Header>
          <HeaderIcon>
            <MdHistory />
          </HeaderIcon>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">{t('versionHistory.title')}</Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {t('versionHistory.subtitle', { count: revisions.length })}
            </Typography>
          </Box>

          <Tooltip title={t('versionHistory.close')}>
            <IconButton onClick={onClose}>
              <MdClose />
            </IconButton>
          </Tooltip>
        </Header>

        <Divider />

        <ScrollArea>
          {loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[0, 1, 2].map(key => (
                <Skeleton
                  key={key}
                  variant="rounded"
                  height={84}
                />
              ))}
            </Box>
          )}

          {!loading && revisions.length === 0 && (
            <EmptyState>
              <MdHistory size={42} />
              <Typography>{t('versionHistory.empty')}</Typography>
            </EmptyState>
          )}

          {!loading && revisions.length > 0 && (
            <Timeline>
              {revisions.map(revision => {
                const state = getRevisionState(revision, {
                  draftId,
                  pendingId,
                  publishedId,
                });
                const meta = stateMeta[state];
                const isCurrent =
                  revision.id === draftId ||
                  revision.id === pendingId ||
                  revision.id === publishedId;
                const isRestoring = restoringId === revision.id;
                // Restoring the current draft would be a no-op.
                const restorable = canRestore && revision.id !== draftId;

                return (
                  <TimelineItem key={revision.id}>
                    <Rail>
                      <Dot dotColor={meta.hex}>{stateIcon[state]}</Dot>
                      <Connector className="timeline-connector" />
                    </Rail>

                    <Card isCurrent={isCurrent}>
                      <CardTopRow>
                        <Chip
                          size="small"
                          color={meta.color}
                          icon={stateIcon[state]}
                          label={stateLabel[state]}
                        />

                        <Tooltip title={formatDate(revision.createdAt)}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ whiteSpace: 'nowrap' }}
                          >
                            {formatRelative(revision.createdAt)}
                          </Typography>
                        </Tooltip>
                      </CardTopRow>

                      <RevisionTitle variant="body2">
                        {revision.title || t('versionHistory.untitled')}
                      </RevisionTitle>

                      {revision.subtitle && (
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

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        component="div"
                        sx={{ mt: 0.5 }}
                      >
                        {t('versionHistory.created', {
                          date: formatDate(revision.createdAt),
                        })}
                        {revision.publishedAt &&
                          ` · ${t('versionHistory.published', {
                            date: formatDate(revision.publishedAt),
                          })}`}
                      </Typography>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mt: 1,
                        }}
                      >
                        {onPreview ?
                          <Button
                            size="small"
                            color="inherit"
                            startIcon={<MdVisibility />}
                            onClick={() => onPreview(revision.id)}
                          >
                            {t('versionHistory.preview')}
                          </Button>
                        : <span />}

                        {isCurrent && !restorable ?
                          <Typography
                            variant="caption"
                            color="primary"
                            sx={{ fontWeight: 600 }}
                          >
                            {t('versionHistory.currentVersion')}
                          </Typography>
                        : restorable && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={
                                isRestoring ?
                                  <CircularProgress size={14} />
                                : <MdRestore />
                              }
                              disabled={!!restoringId}
                              onClick={() => setPendingRestore(revision)}
                            >
                              {t('versionHistory.restore')}
                            </Button>
                          )
                        }
                      </Box>
                    </Card>
                  </TimelineItem>
                );
              })}
            </Timeline>
          )}
        </ScrollArea>
      </DrawerContent>

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
            startIcon={<MdRestore />}
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
