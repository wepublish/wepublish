import styled from '@emotion/styled';
import {
  ChangelogEntryFragment,
  useChangelogEntriesQuery,
  useConfirmChangelogEntryMutation,
} from '@wepublish/editor/api';
import {
  ConfirmActionModal,
  NotificationItem,
  NotificationSeverity,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import { Button, Loader, Message, Modal, Tag, toaster } from 'rsuite';

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
  color: gray;
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
  color: gray;
  font-size: 0.85em;
`;

const CenteredText = styled.p`
  text-align: center;
  color: gray;
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

const markdownUrlTransform = (url: string) =>
  url.startsWith('data:image/') ? url : defaultUrlTransform(url);

function ChangelogMarkdown({ children }: { children: string }) {
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

const getEntrySeverity = (
  entry: ChangelogEntryFragment
): NotificationSeverity => {
  if (!entry.actionRequired) {
    return 'info';
  }

  return entry.confirmedAt ? 'success' : 'warning';
};

function ChangelogEntryTag({ entry }: { entry: ChangelogEntryFragment }) {
  const { t } = useTranslation();

  if (!entry.actionRequired) {
    return null;
  }

  return entry.confirmedAt ?
      <Tag
        color="green"
        size="sm"
      >
        {t('changelog.done')}
      </Tag>
    : <Tag
        color="orange"
        size="sm"
      >
        {t('changelog.actionRequired')}
      </Tag>;
}

interface ChangelogEntryModalProps {
  entry: ChangelogEntryFragment;
  onClose(): void;
  onMarkAsDone?(): void;
}

function ChangelogEntryModal({
  entry,
  onClose,
  onMarkAsDone,
}: ChangelogEntryModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
    >
      <Modal.Header>
        <Modal.Title>{entry.title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
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
      </Modal.Body>

      <Modal.Footer>
        {entry.actionRequired && !entry.confirmedAt && onMarkAsDone && (
          <Button
            appearance="default"
            onClick={onMarkAsDone}
          >
            {t('notifications.markAsDone')}
          </Button>
        )}

        <Button
          appearance="primary"
          onClick={onClose}
        >
          {t('close')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

interface ConfirmChangelogModalProps {
  entry: ChangelogEntryFragment;
  onClose(): void;
}

function ConfirmChangelogModal({ entry, onClose }: ConfirmChangelogModalProps) {
  const { t } = useTranslation();
  const [confirmChangelogEntry, { loading }] = useConfirmChangelogEntryMutation(
    {
      refetchQueries: ['ChangelogEntries'],
      onCompleted() {
        toaster.push(
          <Message
            type="success"
            showIcon
            closable
          >
            {t('notifications.confirmSuccess')}
          </Message>
        );
        onClose();
      },
      onError(error) {
        toaster.push(
          <Message
            type="error"
            showIcon
            closable
          >
            {error.message}
          </Message>
        );
      },
    }
  );

  return (
    <ConfirmActionModal
      title={t('notifications.confirmTitle')}
      message={t('notifications.confirmMessage', { title: entry.title })}
      loading={loading}
      onConfirm={() => confirmChangelogEntry({ variables: { id: entry.id } })}
      onClose={onClose}
    />
  );
}

export interface ChangelogActionRequiredProps {
  sourceTag?: string;
}

export function ChangelogActionRequired({
  sourceTag,
}: ChangelogActionRequiredProps) {
  const { t } = useTranslation();
  const [detailsEntry, setDetailsEntry] =
    useState<ChangelogEntryFragment | null>(null);
  const [confirmEntry, setConfirmEntry] =
    useState<ChangelogEntryFragment | null>(null);

  const { data } = useChangelogEntriesQuery({
    fetchPolicy: 'cache-and-network',
    variables: {
      take: 100,
      filter: { actionRequired: true, confirmed: false },
    },
  });

  const entries = data?.changelogEntries.nodes ?? [];

  if (!entries.length) {
    return null;
  }

  return (
    <>
      <Stack>
        {entries.map(entry => (
          <NotificationItem
            key={entry.id}
            severity="warning"
            title={entry.title}
            tags={<ChangelogEntryTag entry={entry} />}
            sourceTag={sourceTag}
            actions={
              <>
                <Button
                  size="sm"
                  appearance={entry.description ? 'default' : 'primary'}
                  onClick={() => setConfirmEntry(entry)}
                >
                  {t('notifications.markAsDone')}
                </Button>

                {entry.description && (
                  <Button
                    size="sm"
                    appearance="primary"
                    onClick={() => setDetailsEntry(entry)}
                  >
                    {t('changelog.details')}
                  </Button>
                )}
              </>
            }
          >
            <EntryLead>{entry.lead}</EntryLead>
          </NotificationItem>
        ))}
      </Stack>

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
}

export function ChangelogDashboard({
  take = 5,
  paginated = false,
  sourceTag,
  hideUnconfirmedActionRequired = false,
  readEntryIds,
  onMarkRead,
}: ChangelogDashboardProps) {
  const { t } = useTranslation();
  const [limit, setLimit] = useState(take);
  const [detailsEntry, setDetailsEntry] =
    useState<ChangelogEntryFragment | null>(null);
  const [confirmEntry, setConfirmEntry] =
    useState<ChangelogEntryFragment | null>(null);

  const { data, loading, error } = useChangelogEntriesQuery({
    fetchPolicy: 'cache-and-network',
    variables: {
      take:
        limit +
        (hideUnconfirmedActionRequired ? 10 : 0) +
        (readEntryIds?.size ?? 0),
    },
  });

  if (loading && !data) {
    return (
      <LoaderWrapper>
        <Loader />
      </LoaderWrapper>
    );
  }

  if (error) {
    return <Message type="error">{error.message}</Message>;
  }

  const nodes = data?.changelogEntries.nodes ?? [];
  const entries = nodes
    .filter(
      entry =>
        !hideUnconfirmedActionRequired ||
        !(entry.actionRequired && !entry.confirmedAt)
    )
    .filter(entry => !readEntryIds?.has(entry.id))
    .slice(0, limit);

  if (!entries.length) {
    return (
      <CenteredText>
        {nodes.length ? t('changelog.allCaughtUp') : t('changelog.noEntries')}
      </CenteredText>
    );
  }

  return (
    <>
      <Stack>
        {entries.map(entry => (
          <NotificationItem
            key={entry.id}
            severity={getEntrySeverity(entry)}
            title={entry.title}
            tags={<ChangelogEntryTag entry={entry} />}
            sourceTag={sourceTag}
            onClick={() => setDetailsEntry(entry)}
            actions={
              onMarkRead && (!entry.actionRequired || !!entry.confirmedAt) ?
                <Button
                  size="sm"
                  appearance="default"
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
        ))}
      </Stack>

      {paginated && data?.changelogEntries.pageInfo.hasNextPage && (
        <LoadMoreWrapper>
          <Button
            appearance="subtle"
            loading={loading}
            onClick={() => setLimit(limit + take)}
          >
            {t('notifications.loadMore')}
          </Button>
        </LoadMoreWrapper>
      )}

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
}
