import { ApolloError } from '@apollo/client';
import { Poll, usePollsQuery } from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  CreatePollBtn,
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  DeletePollModal,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PaddedCell,
  PollClosedAtView,
  PollOpensAtView,
  PollStateIndication,
  Table,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdDelete } from 'react-icons/md';
import { Link } from 'react-router-dom';
import {
  Button,
  IconButton,
  Message,
  Pagination,
  Table as RTable,
  toaster,
} from 'rsuite';
import { RowDataType } from 'rsuite-table';

const { Column, HeaderCell, Cell: RCell } = RTable;

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

function PollList() {
  const { t } = useTranslation();
  const [pollDelete, setPollDelete] = useState<Poll | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const { data, loading, refetch } = usePollsQuery({
    variables: {
      take: limit,
      skip: (page - 1) * limit,
    },
    onError: onErrorToast,
  });

  /**
   * Refetch data
   */
  useEffect(() => {
    refetch({
      take: limit,
      skip: (page - 1) * limit,
    });
  }, [page, limit]);

  return (
    <>
      <ListViewContainer>
        {/* title */}
        <ListViewHeader>
          <h2>{t('pollList.title')}</h2>
        </ListViewHeader>

        <ListViewActions>
          {/* create new poll */}
          <CreatePollBtn />
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={loading}
          data={data?.polls?.nodes || []}
        >
          {/* state */}
          <Column resizable>
            <HeaderCell>{t('pollList.state')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<Poll>) => (
                <PollStateIndication
                  closedAt={rowData.closedAt}
                  opensAt={rowData.opensAt}
                />
              )}
            </RCell>
          </Column>
          {/* question */}
          <Column
            width={200}
            resizable
          >
            <HeaderCell>{t('pollList.question')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<Poll>) => (
                <Link to={`/polls/edit/${rowData.id}`}>
                  {rowData.question || t('pollList.noQuestion')}
                </Link>
              )}
            </RCell>
          </Column>
          {/* opens at */}
          <Column
            width={300}
            resizable
          >
            <HeaderCell>{t('pollList.opensAt')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<Poll>) => (
                <PollOpensAtView poll={rowData as Poll} />
              )}
            </RCell>
          </Column>
          {/* opens at */}
          <Column
            width={300}
            resizable
          >
            <HeaderCell>{t('pollList.closedAt')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<Poll>) => (
                <PollClosedAtView poll={rowData as Poll} />
              )}
            </RCell>
          </Column>
          {/* delete */}
          <Column
            resizable
            fixed="right"
          >
            <HeaderCell align={'center'}>{t('pollList.delete')}</HeaderCell>
            <PaddedCell align={'center'}>
              {(poll: RowDataType<Poll>) => (
                <IconButton
                  icon={<MdDelete />}
                  circle
                  appearance="ghost"
                  color="red"
                  size="sm"
                  onClick={() => setPollDelete(poll as Poll)}
                />
              )}
            </PaddedCell>
          </Column>
          {/* show votes */}
          <Column
            resizable
            fixed="right"
          >
            <HeaderCell align={'center'}>{t('pollList.showVotes')}</HeaderCell>
            <PaddedCell align={'center'}>
              {(poll: RowDataType<Poll>) => (
                <Button
                  appearance={'primary'}
                  href={`/polls/votes/${poll?.id}`}
                >
                  {t('pollList.showVotes')}
                </Button>
              )}
            </PaddedCell>
          </Column>
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
          layout={['total', '-', 'limit', '|', 'pager', 'skip']}
          total={data?.polls?.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />
      </TableWrapper>

      <DeletePollModal
        poll={pollDelete}
        onDelete={refetch}
        onClose={() => setPollDelete(undefined)}
      />
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_POLL',
  'CAN_CREATE_POLL',
  'CAN_UPDATE_POLL',
  'CAN_DELETE_POLL',
])(PollList);
export { CheckedPermissionComponent as PollList };
