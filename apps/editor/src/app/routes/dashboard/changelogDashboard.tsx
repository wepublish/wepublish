import styled from '@emotion/styled';
import {
  ChangelogEntryFragment,
  useChangelogEntriesQuery,
  useConfirmChangelogEntryMutation,
} from '@wepublish/editor/api';
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

const ActionMessage = styled(Message)`
  margin-bottom: 12px;
`;

const ActionMessageContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const ActionMessageLead = styled.p`
  margin: 4px 0 0;
`;

const ActionMessageButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

const EntryList = styled.div`
  display: flex;
  flex-direction: column;
`;

const EntryItem = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px solid var(--rs-border-primary, #e5e5ea);
  padding: 12px 4px;
  cursor: pointer;

  &:last-of-type {
    border-bottom: none;
  }

  &:hover {
    background: var(--rs-state-hover-bg, #f2faff);
  }
`;

const EntryTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
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
            appearance="primary"
            onClick={onMarkAsDone}
          >
            {t('changelog.markAsDone')}
          </Button>
        )}

        <Button
          appearance="subtle"
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
            {t('changelog.confirmSuccess')}
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
    <Modal
      open
      onClose={onClose}
      size="sm"
      role="alertdialog"
    >
      <Modal.Header>
        <Modal.Title>{t('changelog.confirmTitle')}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {t('changelog.confirmMessage', { title: entry.title })}
      </Modal.Body>

      <Modal.Footer>
        <Button
          appearance="primary"
          loading={loading}
          onClick={() => confirmChangelogEntry({ variables: { id: entry.id } })}
        >
          {t('confirm')}
        </Button>

        <Button
          appearance="subtle"
          onClick={onClose}
        >
          {t('cancel')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export function ChangelogActionRequired() {
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
      {entries.map(entry => (
        <ActionMessage
          key={entry.id}
          type="warning"
          showIcon
        >
          <ActionMessageContent>
            <div>
              <EntryTitleRow>
                <strong>{entry.title}</strong>
                <Tag
                  color="orange"
                  size="sm"
                >
                  {t('changelog.actionRequired')}
                </Tag>
              </EntryTitleRow>

              <ActionMessageLead>{entry.lead}</ActionMessageLead>
            </div>

            <ActionMessageButtons>
              {entry.description && (
                <Button
                  size="sm"
                  appearance="subtle"
                  onClick={() => setDetailsEntry(entry)}
                >
                  {t('changelog.details')}
                </Button>
              )}

              <Button
                size="sm"
                appearance="primary"
                onClick={() => setConfirmEntry(entry)}
              >
                {t('changelog.markAsDone')}
              </Button>
            </ActionMessageButtons>
          </ActionMessageContent>
        </ActionMessage>
      ))}

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
}

export function ChangelogDashboard({
  take = 5,
  paginated = false,
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
      take: limit,
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

  const entries = data?.changelogEntries.nodes ?? [];

  if (!entries.length) {
    return <CenteredText>{t('changelog.noEntries')}</CenteredText>;
  }

  return (
    <>
      <EntryList>
        {entries.map(entry => (
          <EntryItem
            key={entry.id}
            type="button"
            onClick={() => setDetailsEntry(entry)}
          >
            <EntryTitleRow>
              <strong>{entry.title}</strong>

              {entry.actionRequired &&
                (entry.confirmedAt ?
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
                  </Tag>)}
            </EntryTitleRow>

            <EntryLead>{entry.lead}</EntryLead>

            <EntryDate>
              {t('changelog.releasedAt', { date: new Date(entry.releasedAt) })}
            </EntryDate>
          </EntryItem>
        ))}
      </EntryList>

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
