import { useQuery } from '@apollo/client/react';
import { FullPollFragment, PollsDocument } from '@wepublish/editor/api';
import {
  CanCreatePoll,
  CanDeletePoll,
  CanGetPoll,
  CanUpdatePoll,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  CreatePollBtn,
  DataTable,
  DeletePollModal,
  IconButton,
  IconButtonTooltip,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PageTitle,
  Pagination,
  PollClosedAtView,
  PollOpensAtView,
  PollStateIndication,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdDelete, MdHowToVote } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

function PollList() {
  const { t } = useTranslation();
  const [pollDelete, setPollDelete] = useState<FullPollFragment | undefined>(
    undefined
  );
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const { data, loading, refetch } = useQuery(PollsDocument, {
    variables: {
      take: limit,
      skip: (page - 1) * limit,
    },
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
          <PageTitle>{t('pollList.title')}</PageTitle>
        </ListViewHeader>

        <ListViewActions>
          {/* create new poll */}
          <CreatePollBtn />
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="polls"
          data={data?.polls?.nodes || []}
          loading={loading}
          columns={[
            {
              id: 'state',
              label: t('pollList.state'),
              width: 50,
              render: rowData => (
                <PollStateIndication
                  closedAt={rowData.closedAt}
                  opensAt={rowData.opensAt}
                />
              ),
            },
            {
              id: 'question',
              alwaysVisible: true,
              label: t('pollList.question'),
              width: 200,
              render: rowData => (
                <Link to={`/polls/edit/${rowData.id}`}>
                  {rowData.question || t('pollList.noQuestion')}
                </Link>
              ),
            },
            {
              id: 'opensat',
              label: t('pollList.opensAt'),
              width: 300,
              render: rowData => (
                <PollOpensAtView
                  poll={rowData as unknown as FullPollFragment}
                />
              ),
            },
            {
              id: 'closedat',
              label: t('pollList.closedAt'),
              width: 300,
              render: rowData => (
                <PollClosedAtView
                  poll={rowData as unknown as FullPollFragment}
                />
              ),
            },
            {
              id: 'action',
              label: t('action'),
              width: 140,
              align: 'center',
              fixed: true,
              render: poll => (
                <>
                  <IconButtonTooltip caption={t('pollList.showVotes')}>
                    <IconButton
                      component={RouterLink}
                      to={`/polls/votes/${poll?.id}`}
                      aria-label={t('pollList.showVotes')}
                      size="small"
                    >
                      <MdHowToVote />
                    </IconButton>
                  </IconButtonTooltip>
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      aria-label={t('delete')}
                      color="error"
                      size="small"
                      onClick={() =>
                        setPollDelete(poll as unknown as FullPollFragment)
                      }
                    >
                      <MdDelete />
                    </IconButton>
                  </IconButtonTooltip>
                </>
              ),
            },
          ]}
        />

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
  CanGetPoll.id,
  CanCreatePoll.id,
  CanUpdatePoll.id,
  CanDeletePoll.id,
])(PollList);
export { CheckedPermissionComponent as PollList };
