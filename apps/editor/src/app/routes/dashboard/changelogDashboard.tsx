import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  ChangelogEntriesDocument,
  ChangelogEntryFragment,
  ChangelogSeverity,
  ConfirmChangelogEntryDocument,
} from '@wepublish/editor/api';
import { CanUpdateSettings } from '@wepublish/permissions';
import {
  ConfirmActionModal,
  enqueueSnackbar,
  humanizeError,
  NotificationItem,
  useHasPermission,
} from '@wepublish/ui/editor';
import { ReactElement, ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';

import { ChangelogCompactRow } from './changelogDrafts/changelogCompactRow';
import {
  ChangelogSeverityChip,
  changelogNotificationSeverity,
  isOpenChangelogAction,
} from './changelogSeverity';

const MarkdownContainer = styled.div`
  img {
    max-width: 100%;
    height: auto;
  }
`;

const Lead = styled.p`
  font-weight: bold;
  margin-bottom: 12px;
`;

const EntryMeta = styled.p`
  margin-top: 12px;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  font-size: 0.9em;
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const EntryLead = styled.p`
  margin: 0;
`;

const EntryDate = styled.p`
  margin: 4px 0 0;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  font-size: 0.85em;
`;

const CenteredText = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  padding: 12px;
`;

const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 24px;
`;

const LoadMoreWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 12px;
`;

/** Signing an entry off hides it for the whole instance, so it is admin-only. */
export const CONFIRM_PERMISSION = [CanUpdateSettings.id];

const markdownUrlTransform = (url: string) =>
  url.startsWith('data:image/') ? url : defaultUrlTransform(url);

export function ChangelogMarkdown({ children }: { children: string }) {
  return (
    <MarkdownContainer>
      <ReactMarkdown
        urlTransform={markdownUrlTransform}
        components={{
          a: ({ node: _node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </MarkdownContainer>
  );
}

export interface ChangelogEntryModalProps {
  entry: ChangelogEntryFragment;
  onClose(): void;
  onMarkAsDone?(): void;
}

export function ChangelogEntryModal({
  entry,
  onClose,
  onMarkAsDone,
}: ChangelogEntryModalProps) {
  const { t } = useTranslation();
  const mayConfirm = useHasPermission(CONFIRM_PERMISSION);

  return (
    <Dialog
      fullWidth
      open
      onClose={onClose}
      maxWidth="md"
    >
      <DialogTitle>
        {entry.title} <ChangelogSeverityChip entry={entry} />
      </DialogTitle>

      <DialogContent>
        <Lead>{entry.lead}</Lead>

        {entry.description && (
          <ChangelogMarkdown>{entry.description}</ChangelogMarkdown>
        )}

        <EntryMeta>
          {t('changelog.releasedAt', { date: new Date(entry.releasedAt) })}
          {entry.confirmedAt &&
            ` — ${t('changelog.completedAt', {
              date: new Date(entry.confirmedAt),
            })}`}
        </EntryMeta>
      </DialogContent>

      <DialogActions>
        <Button
          variant="text"
          onClick={onClose}
        >
          {t('close')}
        </Button>

        {mayConfirm && isOpenChangelogAction(entry) && onMarkAsDone && (
          <Button
            variant="contained"
            onClick={onMarkAsDone}
          >
            {t('notifications.markAsDone')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

interface ConfirmChangelogModalProps {
  entry: ChangelogEntryFragment;
  onClose(): void;
}

export function ConfirmChangelogModal({
  entry,
  onClose,
}: ConfirmChangelogModalProps) {
  const { t, i18n } = useTranslation();
  const [confirmChangelogEntry, { loading }] = useMutation(
    ConfirmChangelogEntryDocument,
    {
      refetchQueries: ['ChangelogEntries'],
      onCompleted() {
        enqueueSnackbar(t('notifications.confirmSuccess'), {
          variant: 'success',
        });
        onClose();
      },
      onError(error) {
        enqueueSnackbar(humanizeError(error), { variant: 'error' });
      },
    }
  );

  return (
    <ConfirmActionModal
      title={t('notifications.confirmTitle')}
      message={t('notifications.confirmMessage', { title: entry.title })}
      loading={loading}
      onConfirm={() =>
        confirmChangelogEntry({
          variables: { id: entry.id, locale: i18n.language },
        })
      }
      onClose={onClose}
    />
  );
}

/**
 * The details and the "mark as done" dialogs for any list of entries: open
 * one with `showDetails` / `confirm` and render `overlay` somewhere outside
 * the list.
 */
export function useChangelogDialogs({
  onDetailsOpen,
}: { onDetailsOpen?: (entry: ChangelogEntryFragment) => void } = {}) {
  const [detailsEntry, setDetailsEntry] =
    useState<ChangelogEntryFragment | null>(null);
  const [confirmEntry, setConfirmEntry] =
    useState<ChangelogEntryFragment | null>(null);

  const overlay = (
    <>
      {detailsEntry && (
        <ChangelogEntryModal
          entry={detailsEntry}
          onClose={() => setDetailsEntry(null)}
          onMarkAsDone={() => {
            setConfirmEntry(detailsEntry);
            setDetailsEntry(null);
          }}
        />
      )}

      {confirmEntry && (
        <ConfirmChangelogModal
          entry={confirmEntry}
          onClose={() => setConfirmEntry(null)}
        />
      )}
    </>
  );

  return {
    overlay,
    showDetails: (entry: ChangelogEntryFragment) => {
      setDetailsEntry(entry);
      onDetailsOpen?.(entry);
    },
    confirm: setConfirmEntry,
  };
}

export type ChangelogItemVariant = 'default' | 'compact';

export interface ChangelogActionRequiredProps {
  sourceTag?: string;
  /** Reports whether at least one unconfirmed entry is currently rendered */
  onVisibilityChange?: (visible: boolean) => void;
  /** Which action levels to show; both by default */
  severities?: ChangelogSeverity[];
  /** `compact` renders dense rows instead of alert boxes (draft 1) */
  variant?: ChangelogItemVariant;
  /** Fetches and renders nothing */
  skip?: boolean;
}

export interface NotificationSourceResult {
  items: ReactElement[];
  /** Modals belonging to these items, rendered outside the sorted list. */
  overlay?: ReactNode;
}

export const ACTION_SEVERITIES = [
  ChangelogSeverity.Recommended,
  ChangelogSeverity.Required,
];

/**
 * The open action entries as items, so a panel mixing several sources can
 * sort everything by severity instead of stacking source after source.
 */
export function useChangelogActionNotifications({
  sourceTag,
  onVisibilityChange,
  severities = ACTION_SEVERITIES,
  variant = 'default',
  skip = false,
}: ChangelogActionRequiredProps): NotificationSourceResult {
  const { t, i18n } = useTranslation();
  const mayConfirm = useHasPermission(CONFIRM_PERMISSION);
  const { overlay, showDetails, confirm } = useChangelogDialogs();

  const { data } = useQuery(ChangelogEntriesDocument, {
    fetchPolicy: 'cache-and-network',
    skip,
    variables: {
      take: 100,
      filter: { severities, confirmed: false },
      locale: i18n.language,
    },
  });

  const entries = skip ? [] : (data?.changelogEntries.nodes ?? []);

  const hasEntries = entries.length > 0;

  useEffect(() => {
    onVisibilityChange?.(hasEntries);
  }, [onVisibilityChange, hasEntries]);

  return {
    overlay,
    items: entries.map(entry =>
      variant === 'compact' ?
        <ChangelogCompactRow
          key={entry.id}
          severity={changelogNotificationSeverity(entry)}
          entry={entry}
          onOpen={() => showDetails(entry)}
          onConfirm={mayConfirm ? () => confirm(entry) : undefined}
        />
      : <NotificationItem
          key={entry.id}
          severity={changelogNotificationSeverity(entry)}
          title={entry.title}
          tags={<ChangelogSeverityChip entry={entry} />}
          sourceTag={sourceTag}
          actions={
            <>
              {mayConfirm && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => confirm(entry)}
                >
                  {t('notifications.markAsDone')}
                </Button>
              )}

              {entry.description && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => showDetails(entry)}
                >
                  {t('changelog.details')}
                </Button>
              )}
            </>
          }
        >
          <EntryLead>{entry.lead}</EntryLead>
        </NotificationItem>
    ),
  };
}

export function ChangelogActionRequired(props: ChangelogActionRequiredProps) {
  const { items, overlay } = useChangelogActionNotifications(props);

  return (
    <>
      {!!items.length && <Stack>{items}</Stack>}
      {overlay}
    </>
  );
}

export interface ChangelogDashboardProps {
  take?: number;
  paginated?: boolean;
  sourceTag?: string;
  /**
   * Hides entries that are already shown as prominent action-required
   * notifications, so the dashboard does not list them twice.
   */
  hideUnconfirmedActionRequired?: boolean;
  /** Entries whose id is in here are hidden (already read by the user) */
  readEntryIds?: ReadonlySet<string>;
  /** Enables marking entries as read for the current user */
  onMarkRead?: (itemId: string) => void;
  /** Renders nothing instead of the "no entries" placeholder text */
  hideEmptyState?: boolean;
  /** Reports whether at least one entry is currently rendered */
  onVisibilityChange?: (visible: boolean) => void;
  /** `compact` renders dense rows instead of alert boxes (draft 1) */
  variant?: ChangelogItemVariant;
  /** Fetches and renders nothing */
  skip?: boolean;
}

/**
 * The recent entries as items, for a panel that sorts several sources by
 * severity. Loading, the error and the empty state come back with them, since
 * a sorted list has nowhere to put those.
 */
export function useChangelogNewsNotifications({
  take = 5,
  paginated = false,
  sourceTag,
  hideUnconfirmedActionRequired = false,
  readEntryIds,
  onMarkRead,
  onVisibilityChange,
  variant = 'default',
  skip = false,
}: ChangelogDashboardProps): NotificationSourceResult & {
  loading: boolean;
  error?: Error;
  /** How many entries the query returned, before any filtering */
  totalFetched: number;
  /** The "load more" control, when paginating and more pages exist */
  footer?: ReactNode;
} {
  const { t, i18n } = useTranslation();
  const [limit, setLimit] = useState(take);
  const { overlay, showDetails } = useChangelogDialogs();

  const { data, loading, error } = useQuery(ChangelogEntriesDocument, {
    fetchPolicy: 'cache-and-network',
    skip,
    variables: {
      take:
        limit +
        (hideUnconfirmedActionRequired ? 10 : 0) +
        (readEntryIds?.size ?? 0),
      locale: i18n.language,
    },
  });

  const nodes = skip ? [] : (data?.changelogEntries.nodes ?? []);
  const entries = nodes
    .filter(
      entry => !hideUnconfirmedActionRequired || !isOpenChangelogAction(entry)
    )
    .filter(entry => !readEntryIds?.has(entry.id))
    .slice(0, limit);
  const hasEntries = entries.length > 0;

  useEffect(() => {
    onVisibilityChange?.(hasEntries);
  }, [onVisibilityChange, hasEntries]);

  const footer =
    paginated && data?.changelogEntries.pageInfo.hasNextPage ?
      <LoadMoreWrapper>
        <Button
          variant="text"
          loading={loading}
          onClick={() => setLimit(limit + take)}
        >
          {t('notifications.loadMore')}
        </Button>
      </LoadMoreWrapper>
    : undefined;

  return {
    overlay,
    footer,
    loading,
    error,
    totalFetched: nodes.length,
    items: entries.map(entry =>
      variant === 'compact' ?
        <ChangelogCompactRow
          key={entry.id}
          severity={changelogNotificationSeverity(entry)}
          entry={entry}
          onOpen={() => showDetails(entry)}
          onMarkRead={onMarkRead ? () => onMarkRead(entry.id) : undefined}
        />
      : <NotificationItem
          key={entry.id}
          severity={changelogNotificationSeverity(entry)}
          title={entry.title}
          tags={<ChangelogSeverityChip entry={entry} />}
          sourceTag={sourceTag}
          onClick={() => showDetails(entry)}
          actions={
            onMarkRead && !isOpenChangelogAction(entry) ?
              <Button
                variant="outlined"
                size="small"
                onClick={() => onMarkRead(entry.id)}
              >
                {t('notifications.markAsRead')}
              </Button>
            : undefined
          }
        >
          <EntryLead>{entry.lead}</EntryLead>

          <EntryDate>
            {t('changelog.releasedAt', { date: new Date(entry.releasedAt) })}
          </EntryDate>
        </NotificationItem>
    ),
  };
}

export function ChangelogDashboard(props: ChangelogDashboardProps) {
  const { t } = useTranslation();
  const { items, overlay, footer, loading, error, totalFetched } =
    useChangelogNewsNotifications(props);

  if (loading && !totalFetched) {
    return (
      <LoaderWrapper>
        <CircularProgress />
      </LoaderWrapper>
    );
  }

  if (error) {
    return <Alert severity="error">{humanizeError(error)}</Alert>;
  }

  if (!items.length) {
    return props.hideEmptyState ? null : (
        <CenteredText>
          {totalFetched ? t('changelog.allCaughtUp') : t('changelog.noEntries')}
        </CenteredText>
      );
  }

  return (
    <>
      <Stack>{items}</Stack>
      {footer}
      {overlay}
    </>
  );
}
