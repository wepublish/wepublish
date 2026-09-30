import styled from '@emotion/styled';
import {
  FullNewsletterSubscriberFragment,
  FullUserFragment,
  NewsletterSubscriberSource,
  NewsletterSubscriberStatus,
  useAddNewsletterSubscriberMutation,
  useNewsletterSubscriberCountsQuery,
  useNewsletterSubscriberLazyQuery,
  useNewsletterSubscribersQuery,
  useRemoveNewsletterSubscriberMutation,
} from '@wepublish/editor/api';
import { CanUpdateNewsletterSubscribers } from '@wepublish/permissions';
import {
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  IconButton,
  PaddedCell,
  Table,
  TableWrapper,
  useAuthorisation,
  UserSearch,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdPersonAdd, MdPersonRemove } from 'react-icons/md';
import {
  Button,
  IconButton as RIconButton,
  Input,
  Message,
  Modal,
  Pagination,
  Radio,
  RadioGroup,
  Table as RTable,
  toaster,
} from 'rsuite';
import { RowDataType } from 'rsuite/esm/Table';

const { Column, HeaderCell, Cell: RCell } = RTable;

const ALL = 'all';

type NewsletterSubscriberListProps = {
  listId: string;
  requiresSubscription: boolean;
};

type OptOutToConfirm = {
  userId: string;
  unsubscribedAt: string;
};

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin: 12px 0;
`;

const SearchInput = styled(Input)`
  max-width: 320px;
`;

const statusLabel: Record<NewsletterSubscriberStatus, string> = {
  [NewsletterSubscriberStatus.Subscribed]:
    'newsletter.subscribers.statusSubscribed',
  [NewsletterSubscriberStatus.Pending]: 'newsletter.subscribers.statusPending',
  [NewsletterSubscriberStatus.Unsubscribed]:
    'newsletter.subscribers.statusUnsubscribed',
};

const sourceLabel: Record<NewsletterSubscriberSource, string> = {
  [NewsletterSubscriberSource.Self]: 'newsletter.subscribers.sourceSelf',
  [NewsletterSubscriberSource.Auto]: 'newsletter.subscribers.sourceAuto',
  [NewsletterSubscriberSource.Editor]: 'newsletter.subscribers.sourceEditor',
};

const formatDate = (date?: string | null) =>
  date ? new Date(date).toLocaleDateString() : '–';

export const NewsletterSubscriberList = ({
  listId,
  requiresSubscription,
}: NewsletterSubscriberListProps) => {
  const { t } = useTranslation();
  const canUpdate = useAuthorisation(CanUpdateNewsletterSubscribers.id);

  const [status, setStatus] = useState<NewsletterSubscriberStatus>();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [addOpen, setAddOpen] = useState(false);
  const [userToAdd, setUserToAdd] = useState<FullUserFragment | null>();
  const [optOutToConfirm, setOptOutToConfirm] = useState<OptOutToConfirm>();

  const { data, loading, refetch } = useNewsletterSubscribersQuery({
    variables: {
      listId,
      filter: { status, q: q || undefined },
      take: limit,
      skip: (page - 1) * limit,
    },
  });
  const { data: countData, refetch: refetchCounts } =
    useNewsletterSubscriberCountsQuery({ variables: { listId } });
  const [getSubscriber] = useNewsletterSubscriberLazyQuery({
    fetchPolicy: 'network-only',
  });
  const [addSubscriber] = useAddNewsletterSubscriberMutation();
  const [removeSubscriber] = useRemoveNewsletterSubscriberMutation();

  const counts = countData?.newsletterSubscriberCounts;
  const total =
    (counts?.subscribed ?? 0) +
    (counts?.pending ?? 0) +
    (counts?.unsubscribed ?? 0);

  const toast = (type: 'success' | 'warning' | 'error', text: string) =>
    toaster.push(
      <Message
        type={type}
        showIcon
        closable
        duration={3000}
      >
        {text}
      </Message>
    );

  const refresh = () => Promise.all([refetch(), refetchCounts()]);

  const add = async (userId: string, force: boolean) => {
    try {
      const { data } = await addSubscriber({
        variables: { listId, userId, force },
      });

      if (requiresSubscription && !data?.addNewsletterSubscriber.receiving) {
        toast('warning', t('newsletter.subscribers.addedNotReceiving'));
      } else {
        toast('success', t('newsletter.subscribers.added'));
      }

      await refresh();
    } catch (error) {
      toast('error', (error as Error).message);
    }
  };

  const onAddConfirm = async () => {
    const userId = userToAdd?.id;
    setAddOpen(false);
    setUserToAdd(undefined);

    if (!userId) {
      return;
    }

    try {
      const { data } = await getSubscriber({ variables: { listId, userId } });
      const existing = data?.newsletterSubscriber;

      if (
        existing?.status === NewsletterSubscriberStatus.Unsubscribed &&
        existing.unsubscribedAt
      ) {
        setOptOutToConfirm({ userId, unsubscribedAt: existing.unsubscribedAt });
        return;
      }

      await add(userId, false);
    } catch (error) {
      toast('error', (error as Error).message);
    }
  };

  const onRemove = async (userId: string) => {
    try {
      await removeSubscriber({ variables: { listId, userId } });
      toast('success', t('newsletter.subscribers.removed'));
      await refresh();
    } catch (error) {
      toast('error', (error as Error).message);
    }
  };

  return (
    <>
      <Toolbar>
        <RadioGroup
          inline
          appearance="picker"
          value={status ?? ALL}
          onChange={value => {
            setStatus(
              value === ALL ? undefined : (value as NewsletterSubscriberStatus)
            );
            setPage(1);
          }}
        >
          <Radio value={ALL}>
            {t('newsletter.subscribers.filterAll', { count: total })}
          </Radio>
          <Radio value={NewsletterSubscriberStatus.Subscribed}>
            {t('newsletter.subscribers.filterSubscribed', {
              count: counts?.subscribed ?? 0,
            })}
          </Radio>
          <Radio value={NewsletterSubscriberStatus.Pending}>
            {t('newsletter.subscribers.filterPending', {
              count: counts?.pending ?? 0,
            })}
          </Radio>
          <Radio value={NewsletterSubscriberStatus.Unsubscribed}>
            {t('newsletter.subscribers.filterUnsubscribed', {
              count: counts?.unsubscribed ?? 0,
            })}
          </Radio>
        </RadioGroup>

        <SearchInput
          value={q}
          placeholder={t('newsletter.subscribers.searchPlaceholder')}
          onChange={value => {
            setQ(value);
            setPage(1);
          }}
        />

        {canUpdate && (
          <RIconButton
            appearance="primary"
            icon={<MdAdd />}
            onClick={() => setAddOpen(true)}
          >
            {t('newsletter.subscribers.add')}
          </RIconButton>
        )}
      </Toolbar>

      <TableWrapper>
        <Table
          autoHeight
          loading={loading}
          data={data?.newsletterSubscribers.nodes ?? []}
        >
          <Column
            width={200}
            resizable
          >
            <HeaderCell>{t('newsletter.subscribers.name')}</HeaderCell>
            <RCell>
              {(subscriber: FullNewsletterSubscriberFragment) =>
                [subscriber.user.firstName, subscriber.user.name]
                  .filter(Boolean)
                  .join(' ')
              }
            </RCell>
          </Column>

          <Column
            width={250}
            resizable
          >
            <HeaderCell>{t('newsletter.subscribers.email')}</HeaderCell>
            <RCell>
              {(subscriber: FullNewsletterSubscriberFragment) =>
                subscriber.user.email
              }
            </RCell>
          </Column>

          <Column
            width={130}
            resizable
          >
            <HeaderCell>{t('newsletter.subscribers.status')}</HeaderCell>
            <RCell>
              {(subscriber: FullNewsletterSubscriberFragment) =>
                t(statusLabel[subscriber.status])
              }
            </RCell>
          </Column>

          <Column
            width={130}
            resizable
          >
            <HeaderCell>{t('newsletter.subscribers.source')}</HeaderCell>
            <RCell>
              {(subscriber: FullNewsletterSubscriberFragment) =>
                t(sourceLabel[subscriber.source])
              }
            </RCell>
          </Column>

          <Column
            width={130}
            resizable
          >
            <HeaderCell>{t('newsletter.subscribers.subscribedAt')}</HeaderCell>
            <RCell>
              {(subscriber: FullNewsletterSubscriberFragment) =>
                formatDate(subscriber.subscribedAt)
              }
            </RCell>
          </Column>

          <Column
            width={130}
            resizable
          >
            <HeaderCell>
              {t('newsletter.subscribers.unsubscribedAt')}
            </HeaderCell>
            <RCell>
              {(subscriber: FullNewsletterSubscriberFragment) =>
                formatDate(subscriber.unsubscribedAt)
              }
            </RCell>
          </Column>

          {requiresSubscription && (
            <Column
              width={150}
              resizable
            >
              <HeaderCell>{t('newsletter.subscribers.receiving')}</HeaderCell>
              <RCell>
                {(subscriber: FullNewsletterSubscriberFragment) =>
                  subscriber.receiving ?
                    t('newsletter.subscribers.receivingYes')
                  : t('newsletter.subscribers.receivingNo')
                }
              </RCell>
            </Column>
          )}

          {canUpdate && (
            <Column
              fixed="right"
              width={70}
            >
              <HeaderCell align="center">
                {t('newsletter.subscribers.actions')}
              </HeaderCell>
              <PaddedCell align="center">
                {(subscriber: RowDataType<FullNewsletterSubscriberFragment>) =>
                  (
                    subscriber.status ===
                      NewsletterSubscriberStatus.Unsubscribed &&
                    subscriber.unsubscribedAt
                  ) ?
                    <IconButton
                      icon={<MdPersonAdd />}
                      circle
                      appearance="ghost"
                      size="sm"
                      aria-label={t('newsletter.subscribers.reAdd')}
                      onClick={() =>
                        setOptOutToConfirm({
                          userId: subscriber.user.id,
                          unsubscribedAt: subscriber.unsubscribedAt,
                        })
                      }
                    />
                  : <IconButton
                      icon={<MdPersonRemove />}
                      circle
                      appearance="ghost"
                      color="red"
                      size="sm"
                      aria-label={t('newsletter.subscribers.remove')}
                      onClick={() => onRemove(subscriber.user.id)}
                    />
                }
              </PaddedCell>
            </Column>
          )}
        </Table>
      </TableWrapper>

      <Pagination
        limit={limit}
        limitOptions={DEFAULT_TABLE_PAGE_SIZES}
        maxButtons={DEFAULT_MAX_TABLE_PAGES}
        first
        last
        prev
        next
        ellipsis
        boundaryLinks
        layout={['total', '-', 'limit', '|', 'pager', 'skip']}
        total={data?.newsletterSubscribers.totalCount ?? 0}
        activePage={page}
        onChangePage={setPage}
        onChangeLimit={setLimit}
      />

      <Modal
        open={addOpen}
        backdrop="static"
        size="sm"
        onClose={() => setAddOpen(false)}
      >
        <Modal.Title>{t('newsletter.subscribers.addTitle')}</Modal.Title>
        <Modal.Body>
          <UserSearch
            name="user"
            user={userToAdd}
            placeholder={t('newsletter.subscribers.addUser')}
            onUpdateUser={setUserToAdd}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            appearance="primary"
            disabled={!userToAdd}
            onClick={onAddConfirm}
          >
            {t('newsletter.subscribers.addConfirm')}
          </Button>
          <Button
            appearance="subtle"
            onClick={() => setAddOpen(false)}
          >
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        open={!!optOutToConfirm}
        backdrop="static"
        size="xs"
        onClose={() => setOptOutToConfirm(undefined)}
      >
        <Modal.Title>{t('newsletter.subscribers.reAddTitle')}</Modal.Title>
        <Modal.Body>
          {optOutToConfirm &&
            t('newsletter.subscribers.reAddBody', {
              date: formatDate(optOutToConfirm.unsubscribedAt),
            })}
        </Modal.Body>
        <Modal.Footer>
          <Button
            appearance="primary"
            onClick={() => {
              if (optOutToConfirm) {
                add(optOutToConfirm.userId, true);
              }

              setOptOutToConfirm(undefined);
            }}
          >
            {t('newsletter.subscribers.reAddConfirm')}
          </Button>
          <Button
            appearance="subtle"
            onClick={() => setOptOutToConfirm(undefined)}
          >
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
