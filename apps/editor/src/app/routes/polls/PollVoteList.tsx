import {
  FullPollVoteFragment,
  FullPollVoteWithAnswerFragment,
  PollQueryResult,
  PollVoteListQueryResult,
  PollVoteListQueryVariables,
} from '@wepublish/editor/api-v2';
import {
  ListFilters,
  ListViewContainer,
  ListViewHeader,
  Pagination,
  QueryState,
  SelectedItemsActions,
  Table,
  TableWrapper,
  useLoader,
  useSelectableList,
} from '@wepublish/ui/editor';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Checkbox, Table as RTable } from 'rsuite';

const { Column, HeaderCell, Cell: RCell } = RTable;

type PollVotesListProps = {
  listQueryState: QueryState<PollVoteListQueryVariables>;
  listQuery: PollVoteListQueryResult;
  pollQuery: PollQueryResult;
  deleteItems: (ids: string[]) => Promise<void>;
};

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

  const ids = useMemo(
    () => listQuery?.data?.pollVotes?.nodes?.map(n => n.id),
    [listQuery?.data?.pollVotes?.nodes]
  );
  const { selectedItems, allSelected, someSelected, toggleItem, toggleAll } =
    useSelectableList({ ids });
  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{pollQuery?.data?.poll?.question || t('pollList.noQuestion')}</h2>
        </ListViewHeader>
        <ListFilters
          fields={['dates', 'answerIds', 'fingerprint']}
          filter={filter ?? {}}
          isLoading={listQuery?.loading}
          onSetFilter={filter => setFilter(filter)}
        />
      </ListViewContainer>

      <SelectedItemsActions selectedItems={selectedItems}>
        <Button
          onClick={() => wrapLoading(deleteItems(selectedItems))}
          loading={loading}
        >
          {t('pollVoteList.deleteItems')}
        </Button>
      </SelectedItemsActions>
      <TableWrapper>
        <Table
          fillHeight
          loading={listQuery.loading}
          data={listQuery?.data?.pollVotes.nodes}
          sortColumn={sortField ?? 'createdAt'}
          sortType={sortOrder}
          onSortColumn={(sortColumn, sortType) => {
            setSortOrder(sortType!);
            setSortField(sortColumn);
          }}
        >
          <Column width={80}>
            <HeaderCell>
              <Checkbox
                inline
                onChange={toggleAll}
                indeterminate={someSelected}
                checked={allSelected}
              />
            </HeaderCell>
            <RCell>
              {({ id }: FullPollVoteWithAnswerFragment) => {
                return (
                  <Checkbox
                    inline
                    value={id}
                    onChange={toggleItem}
                    checked={selectedItems.includes(id)}
                  />
                );
              }}
            </RCell>
          </Column>

          <Column
            width={250}
            align="left"
            resizable
            sortable
          >
            <HeaderCell>{t('pollVoteList.createdAt')}</HeaderCell>
            <RCell dataKey="createdAt">
              {({ createdAt }: FullPollVoteFragment) =>
                `${new Date(createdAt).toLocaleDateString()} ${new Date(
                  createdAt
                ).toLocaleTimeString()}`
              }
            </RCell>
          </Column>
          <Column
            width={250}
            align="left"
            resizable
          >
            <HeaderCell>{t('pollVoteList.answerId')}</HeaderCell>
            <RCell dataKey="answerId">
              {({ answer }: FullPollVoteWithAnswerFragment) => answer.answer}
            </RCell>
          </Column>
          <Column
            width={250}
            align="left"
            resizable
          >
            <HeaderCell>{t('pollVoteList.userId')}</HeaderCell>
            <RCell dataKey="userId">
              {({ userId }: FullPollVoteFragment) => userId}
            </RCell>
          </Column>
          <Column
            width={250}
            align="left"
            resizable
          >
            <HeaderCell>{t('pollVoteList.fingerprint')}</HeaderCell>
            <RCell dataKey="userId">
              {({ fingerprint }: FullPollVoteFragment) => fingerprint}
            </RCell>
          </Column>
        </Table>
        <Pagination
          state={listQueryState}
          totalCount={listQuery?.data?.pollVotes?.totalCount}
        />
      </TableWrapper>
    </>
  );
}
