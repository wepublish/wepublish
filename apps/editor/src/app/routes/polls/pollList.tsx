import { useQuery } from '@apollo/client/react';
import { FullPollFragment, PollsDocument } from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  CreatePollBtn,
  DeletePollModal,
  enqueueSnackbar,
  humanizeError,
  IconButton,
  IconButtonTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PaddedCell,
  Pagination,
  PollClosedAtView,
  PollOpensAtView,
  PollStateIndication,
  Table,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdDelete, MdHowToVote } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Table as RTable } from 'rsuite';
import { RowDataType } from 'rsuite-table';

const { Column, HeaderCell, Cell: RCell } = RTable;

const onErrorToast = (error: Error) => {
  if (error?.message) {
    enqueueSnackbar(error && humanizeError(error), {
      variant: 'error',
      autoHideDuration: 8000,
    });
  }
};

function PollList() {
  const { t } = useTranslation();
  const [pollDelete, setPollDelete] = useState<FullPollFragment | undefined>(
    undefined
  );
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const { data, loading, refetch, error } = useQuery(PollsDocument, {
    variables: {
      take: limit,
      skip: (page - 1) * limit,
    },
  });

  useEffect(() => {
    if (error) {
      onErrorToast(error);
    }
  }, [error]);

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
          <Column width={50}>
            <HeaderCell>{t('pollList.state')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullPollFragment>) => (
                <PollStateIndication
                  closedAt={rowData.closedAt}
                  opensAt={rowData.opensAt}
                />
              )}
            </RCell>
          </Column>

          <Column
            width={200}
            resizable
          >
            <HeaderCell>{t('pollList.question')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullPollFragment>) => (
                <Link to={`/polls/edit/${rowData.id}`}>
                  {rowData.question || t('pollList.noQuestion')}
                </Link>
              )}
            </RCell>
          </Column>

          <Column
            width={300}
            resizable
          >
            <HeaderCell>{t('pollList.opensAt')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullPollFragment>) => (
                <PollOpensAtView poll={rowData as FullPollFragment} />
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
              {(rowData: RowDataType<FullPollFragment>) => (
                <PollClosedAtView poll={rowData as FullPollFragment} />
              )}
            </RCell>
          </Column>
          <Column
            width={140}
            align="center"
            fixed="right"
          >
            <HeaderCell align="center">{t('action')}</HeaderCell>
            <PaddedCell align="center">
              {(poll: RowDataType<FullPollFragment>) => (
                <>
                  <IconButtonTooltip caption={t('pollList.showVotes')}>
                    <Link to={`/polls/votes/${poll?.id}`}>
                      <IconButton
                        aria-label={t('pollList.showVotes')}
                        size="small"
                      >
                        <MdHowToVote />
                      </IconButton>
                    </Link>
                  </IconButtonTooltip>
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      aria-label={t('delete')}
                      color="error"
                      size="small"
                      onClick={() => setPollDelete(poll as FullPollFragment)}
                    >
                      <MdDelete />
                    </IconButton>
                  </IconButtonTooltip>
                </>
              )}
            </PaddedCell>
          </Column>
        </Table>

        <Pagination
          state={{
            page,
            limit,
            setPage,
            setLimit,
          }}
          totalCount={data?.polls?.totalCount ?? 0}
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
