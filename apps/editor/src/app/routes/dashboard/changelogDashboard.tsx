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
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';

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

export const ACTION_SEVERITIES = [
  ChangelogSeverity.Recommended,
  ChangelogSeverity.Required,
];

export interface ChangelogDashboardProps {
  take?: number;
}

export function ChangelogDashboard({ take = 10 }: ChangelogDashboardProps) {
  const { t, i18n } = useTranslation();
  const [limit, setLimit] = useState(take);
  const { overlay, showDetails } = useChangelogDialogs();

  const { data, loading, error } = useQuery(ChangelogEntriesDocument, {
    fetchPolicy: 'cache-and-network',
    variables: { take: limit, locale: i18n.language },
  });

  const entries = data?.changelogEntries.nodes ?? [];

  if (loading && !entries.length) {
    return (
      <LoaderWrapper>
        <CircularProgress />
      </LoaderWrapper>
    );
  }

  if (error) {
    return <Alert severity="error">{humanizeError(error)}</Alert>;
  }

  if (!entries.length) {
    return <CenteredText>{t('changelog.noEntries')}</CenteredText>;
  }

  return (
    <>
      <Stack>
        {entries.map(entry => (
          <NotificationItem
            key={entry.id}
            severity={changelogNotificationSeverity(entry)}
            title={entry.title}
            tags={<ChangelogSeverityChip entry={entry} />}
            onClick={() => showDetails(entry)}
          >
            <EntryLead>{entry.lead}</EntryLead>

            <EntryDate>
              {t('changelog.releasedAt', { date: new Date(entry.releasedAt) })}
            </EntryDate>
          </NotificationItem>
        ))}
      </Stack>

      {data?.changelogEntries.pageInfo.hasNextPage && (
        <LoadMoreWrapper>
          <Button
            variant="text"
            loading={loading}
            onClick={() => setLimit(limit + take)}
          >
            {t('notifications.loadMore')}
          </Button>
        </LoadMoreWrapper>
      )}

      {overlay}
    </>
  );
}
