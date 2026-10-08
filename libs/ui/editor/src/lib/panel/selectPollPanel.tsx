import { useLazyQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { FullPollFragment, PollsDocument } from '@wepublish/editor/api';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAddCircle } from 'react-icons/md';
import {
  Button,
  Drawer,
  IconButton,
  Message,
  Pagination,
  Table as RTable,
  toaster,
} from 'rsuite';
import { RowDataType } from 'rsuite-table';

import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { PollStateIndication } from '../atoms/poll/pollStateIndication';
import { PollBlockValue } from '../blocks/types';
import { DEFAULT_MAX_TABLE_PAGES, DEFAULT_TABLE_PAGE_SIZES } from '../utility';
import { humanizeError } from '../humanizeError';
import { Table } from '../listView/list-view';

export function PollOpensAtView({ poll }: { poll: FullPollFragment }) {
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

export function PollClosedAtView({ poll }: { poll: FullPollFragment }) {
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

const onErrorToast = (error: Error) => {
  if (error?.message) {
    toaster.push(
      <Message
        type="error"
        showIcon
        closable
        duration={8000}
      >
        {error && humanizeError(error)}
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

  const [fetchPolls, { data, loading, error: pollsError }] =
    useLazyQuery(PollsDocument);

  useEffect(() => {
    if (pollsError) {
      onErrorToast(pollsError);
    }
  }, [pollsError]);

  useEffect(() => {
    fetchPolls({
      variables: {
        take: limit,
        skip: (page - 1) * limit,
      },
    });
  }, [page, limit, fetchPolls]);

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
          <RTable.Column resizable>
            <RTable.HeaderCell>{t('pollList.state')}</RTable.HeaderCell>
            <RTable.Cell>
              {(rowData: RowDataType<FullPollFragment>) => (
                <PollStateIndication
                  closedAt={rowData.closedAt}
                  opensAt={rowData.opensAt}
                />
              )}
            </RTable.Cell>
          </RTable.Column>

          <RTable.Column
            resizable
            width={200}
          >
            <RTable.HeaderCell>{t('pollList.question')}</RTable.HeaderCell>
            <RTable.Cell>
              {(rowData: RowDataType<FullPollFragment>) =>
                rowData.question || t('pollList.noQuestion')
              }
            </RTable.Cell>
          </RTable.Column>

          <RTable.Column
            width={250}
            resizable
          >
            <RTable.HeaderCell>{t('pollList.opensAt')}</RTable.HeaderCell>
            <RTable.Cell>
              {(rowData: RowDataType<FullPollFragment>) => (
                <PollOpensAtView poll={rowData as FullPollFragment} />
              )}
            </RTable.Cell>
          </RTable.Column>

          <RTable.Column
            width={250}
            resizable
          >
            <RTable.HeaderCell>{t('pollList.closedAt')}</RTable.HeaderCell>
            <RTable.Cell>
              {(rowData: RowDataType<FullPollFragment>) => (
                <PollClosedAtView poll={rowData as FullPollFragment} />
              )}
            </RTable.Cell>
          </RTable.Column>

          <RTable.Column
            width={100}
            align="center"
            fixed="right"
          >
            <RTable.HeaderCell align="center">{t('action')}</RTable.HeaderCell>
            <RTable.Cell align="center">
              {(rowData: RowDataType<FullPollFragment>) => (
                <IconButtonTooltip caption={t('blocks.poll.select')}>
                  <IconButton
                    aria-label={t('blocks.poll.select')}
                    icon={<MdAddCircle />}
                    circle
                    size="sm"
                    onClick={() => {
                      onSelect({ id: rowData.id, question: rowData.question });
                      onClose();
                    }}
                  />
                </IconButtonTooltip>
              )}
            </RTable.Cell>
          </RTable.Column>
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
