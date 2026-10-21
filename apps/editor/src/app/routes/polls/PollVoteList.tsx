import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Button, Checkbox } from '@mui/material';
import {
  PollQuery,
  PollQueryVariables,
  PollVoteListQuery,
  PollVoteListQueryVariables,
} from '@wepublish/editor/api';
import {
  clearFilters,
  countActiveFilters,
  DataTable,
  InfoTooltip,
  ListFilters,
  ListViewContainer,
  ListViewHeader,
  Pagination,
  QueryState,
  SelectedItemsActions,
  TableWrapper,
  useLoader,
  useSelectableList,
  PageTitle,
} from '@wepublish/ui/editor';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const HeaderInfo = styled.span`
  display: inline-flex;
  margin-left: 4px;
`;

type PollVotesListProps = {
  listQueryState: QueryState<PollVoteListQueryVariables>;
  listQuery: useQuery.Result<
    PollVoteListQuery,
    PollVoteListQueryVariables,
    'complete' | 'streaming' | 'empty'
  >;
  pollQuery: useQuery.Result<
    PollQuery,
    PollQueryVariables,
    'complete' | 'streaming' | 'empty'
  >;
  deleteItems: (ids: string[]) => Promise<void>;
};

const POLL_VOTE_FILTER_FIELDS = ['dates', 'answerIds', 'fingerprint'] as const;

export function PollVoteList({
  listQueryState,
  listQuery,
  pollQuery,
  deleteItems,
}: PollVotesListProps) {
  const {
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    filter,
    setFilter,
  } = listQueryState;
  const { loading, wrapLoading } = useLoader();
  const { t } = useTranslation();

  const voteNodes = listQuery?.data?.pollVotes?.nodes;
  const ids = useMemo(
    () =>
      voteNodes?.map(n => n.id).filter((id): id is string => id !== undefined),
    [voteNodes]
  );
  const { selectedItems, allSelected, someSelected, toggleItem, toggleAll } =
    useSelectableList({ ids });

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>
            {pollQuery?.data?.poll?.question || t('pollList.noQuestion')}
          </PageTitle>
        </ListViewHeader>
      </ListViewContainer>

      <SelectedItemsActions selectedItems={selectedItems}>
        <Button
          variant="outlined"
          onClick={() => wrapLoading(deleteItems(selectedItems))}
          loading={loading}
        >
          {t('pollVoteList.deleteItems')}
        </Button>
      </SelectedItemsActions>
      <TableWrapper>
        <DataTable
          filters={
            <ListFilters
              fields={POLL_VOTE_FILTER_FIELDS}
              filter={filter ?? {}}
              isLoading={listQuery?.loading}
              onSetFilter={filter => setFilter(filter)}
            />
          }
          filterCount={countActiveFilters(
            POLL_VOTE_FILTER_FIELDS,
            filter ?? {}
          )}
          onResetFilters={() =>
            setFilter(clearFilters(POLL_VOTE_FILTER_FIELDS, filter ?? {}))
          }
          storageKey="poll-votes"
          data={listQuery?.data?.pollVotes?.nodes ?? []}
          loading={listQuery.loading}
          sortColumn={sortField ?? 'createdAt'}
          sortOrder={sortOrder}
          onSort={(sortColumn, sortType) => {
            setSortOrder(sortType!);
            setSortField(sortColumn);
          }}
          sortable={['createdAt']}
          columns={[
            {
              id: 'column-1',
              label: (
                <Checkbox
                  size="small"
                  onChange={() => toggleAll()}
                  indeterminate={someSelected}
                  checked={allSelected}
                />
              ),
              width: 80,
              render: ({ id }) => {
                return (
                  <Checkbox
                    size="small"
                    value={id}
                    onChange={(_event, checked) => toggleItem(id, checked)}
                    checked={selectedItems.includes(id)}
                  />
                );
              },
            },
            {
              id: 'createdat',
              label: t('pollVoteList.createdAt'),
              width: 250,
              align: 'left',
              sortKey: 'createdAt',
              render: ({ createdAt }) =>
                `${new Date(createdAt).toLocaleDateString()} ${new Date(
                  createdAt
                ).toLocaleTimeString()}`,
            },
            {
              id: 'answerid',
              label: t('pollVoteList.answerId'),
              width: 250,
              align: 'left',
              sortKey: 'answerId',
              render: ({ answer }) => answer.answer,
            },
            {
              id: 'userid',
              label: (
                <>
                  {t('pollVoteList.userId')}
                  <HeaderInfo>
                    <InfoTooltip text={t('pollVoteList.userIdInfo')} />
                  </HeaderInfo>
                </>
              ),
              width: 250,
              align: 'left',
              sortKey: 'userId',
              render: ({ userId }) => userId,
            },
            {
              id: 'fingerprint',
              label: (
                <>
                  {t('pollVoteList.fingerprint')}
                  <HeaderInfo>
                    <InfoTooltip text={t('pollVoteList.fingerprintInfo')} />
                  </HeaderInfo>
                </>
              ),
              width: 250,
              align: 'left',
              sortKey: 'userId',
              render: ({ fingerprint }) => fingerprint,
            },
          ]}
        />
        <Pagination
          state={listQueryState}
          totalCount={listQuery?.data?.pollVotes?.totalCount}
        />
      </TableWrapper>
    </>
  );
}
