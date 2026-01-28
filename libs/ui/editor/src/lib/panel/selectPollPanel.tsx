import { ApolloError } from '@apollo/client';
import styled from '@emotion/styled';
import { Poll, usePollsLazyQuery } from '@wepublish/editor/api';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAddCircle } from 'react-icons/md';
import {
  Button,
  Drawer,
  IconButton,
  Message,
  Pagination,
  Table,
  toaster,
} from 'rsuite';
import { RowDataType } from 'rsuite-table';

import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { PollStateIndication } from '../atoms/poll/pollStateIndication';
import { PollBlockValue } from '../blocks/types';
import { DEFAULT_MAX_TABLE_PAGES, DEFAULT_TABLE_PAGE_SIZES } from '../utility';

export function PollOpensAtView({ poll }: { poll: Poll }) {
  const now = new Date();
  const opensAt = new Date(poll.opensAt);
  const { t } = useTranslation();

  // poll is open
  if (now.getTime() > opensAt.getTime()) {
    return <>{t('pollList.openedAt', { openedAt: opensAt })}</>;
  }

  // poll is waiting to open
  return <>{t('pollList.pollWillOpenAt', { opensAt })}</>;
}

export function PollClosedAtView({ poll }: { poll: Poll }) {
  const now = new Date();
  const closedAt = poll.closedAt ? new Date(poll.closedAt) : undefined;
  const { t } = useTranslation();

  // poll has been closed
  if (closedAt && now.getTime() >= closedAt.getTime()) {
    return <>{t('pollList.hasBeenClosedAt', { closedAt })}</>;
  }

  return <>{t('pollList.closedAtNone')}</>;
}

const DrawerBody = styled(Drawer.Body)`
  padding: 24px;
`;

const onErrorToast = (error: ApolloError) => {
  if (error?.message) {
    toaster.push(
      <Message
        type="error"
        showIcon
        closable
        duration={3000}
      >
        {error?.message}
      </Message>
    );
  }
};

export type SelectPollPanelProps = {
  selectedPoll: PollBlockValue['poll'] | null | undefined;
  onClose(): void;
  onSelect(poll: PollBlockValue['poll'] | null | undefined): void;
};

export function SelectPollPanel({
  selectedPoll,
  onClose,
  onSelect,
}: SelectPollPanelProps) {
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const { t } = useTranslation();
  const [fetchPolls, { data, loading }] = usePollsLazyQuery({
    onError: onErrorToast,
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    fetchPolls({
      variables: {
        take: limit,
        skip: (page - 1) * limit,
      },
    });
  }, [page, limit]);

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('blocks.poll.title')}</Drawer.Title>

        <Drawer.Actions>
          <Button
            appearance={'ghost'}
            onClick={() => onClose()}
          >
            {t('close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <DrawerBody>
        <Table
          minHeight={600}
          autoHeight
          loading={loading}
          data={data?.polls?.nodes || []}
          rowClassName={rowData =>
            rowData?.id === selectedPoll?.id ? 'highlighted-row' : ''
          }
        >
          <Table.Column resizable>
            <Table.HeaderCell>{t('pollList.state')}</Table.HeaderCell>
            <Table.Cell>
              {(rowData: RowDataType<Poll>) => (
                <PollStateIndication
                  closedAt={rowData.closedAt}
                  opensAt={rowData.opensAt}
                />
              )}
            </Table.Cell>
          </Table.Column>

          <Table.Column
            resizable
            width={200}
          >
            <Table.HeaderCell>{t('pollList.question')}</Table.HeaderCell>
            <Table.Cell>
              {(rowData: RowDataType<Poll>) =>
                rowData.question || t('pollList.noQuestion')
              }
            </Table.Cell>
          </Table.Column>

          <Table.Column
            width={250}
            resizable
          >
            <Table.HeaderCell>{t('pollList.opensAt')}</Table.HeaderCell>
            <Table.Cell>
              {(rowData: RowDataType<Poll>) => (
                <PollOpensAtView poll={rowData as Poll} />
              )}
            </Table.Cell>
          </Table.Column>

          <Table.Column
            width={250}
            resizable
          >
            <Table.HeaderCell>{t('pollList.closedAt')}</Table.HeaderCell>
            <Table.Cell>
              {(rowData: RowDataType<Poll>) => (
                <PollClosedAtView poll={rowData as Poll} />
              )}
            </Table.Cell>
          </Table.Column>

          <Table.Column width={125}>
            <Table.HeaderCell align="center">
              {t('blocks.poll.select')}
            </Table.HeaderCell>
            <Table.Cell align="center">
              {(rowData: RowDataType<Poll>) => (
                <IconButtonTooltip caption={t('blocks.poll.select')}>
                  <IconButton
                    icon={<MdAddCircle />}
                    appearance="primary"
                    circle
                    size="xs"
                    onClick={() => {
                      onSelect({ id: rowData.id, question: rowData.question });
                      onClose();
                    }}
                  />
                </IconButtonTooltip>
              )}
            </Table.Cell>
          </Table.Column>
        </Table>

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
          layout={['total', '-', 'limit', '|', 'pager']}
          total={data?.polls?.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />
      </DrawerBody>
    </>
  );
}
