import {PollQueryResult} from '@wepublish/editor/api'
import {
  FullPollVoteFragment,
  FullPollVoteWithAnswerFragment,
  PollVoteListQueryResult,
  PollVoteListQueryVariables
} from '@wepublish/editor/api-v2'
import {
  ListFilters,
  ListViewContainer,
  ListViewHeader,
  Pagination,
  QueryState,
  Table,
  TableWrapper,
  useListCheckboxes
} from '@wepublish/ui/editor'
import {useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {Checkbox, Table as RTable} from 'rsuite'

const {Column, HeaderCell, Cell: RCell} = RTable

type PollVotesListProps = {
  listQueryState: QueryState<PollVoteListQueryVariables>
  listQuery: PollVoteListQueryResult
  pollQuery: PollQueryResult
}

export function PollVoteList({listQueryState, listQuery, pollQuery}: PollVotesListProps) {
  const {sortField, setSortField, sortOrder, setSortOrder, filter, setFilter} = listQueryState
  const {t} = useTranslation()
  const ids = useMemo(
    () => listQuery?.data?.pollVotes?.nodes?.map(n => n.id),
    [listQuery?.data?.pollVotes?.nodes.length]
  )
  const {selectedItems, allSelected, someSelected, onChangeItem, onChangeAll} = useListCheckboxes({
    ids
  })

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

      <TableWrapper>
        <Table
          fillHeight
          loading={listQuery.loading}
          data={listQuery?.data?.pollVotes.nodes}
          sortColumn={sortField ?? 'createdAt'}
          sortType={sortOrder}
          onSortColumn={(sortColumn, sortType) => {
            setSortOrder(sortType!)
            setSortField(sortColumn)
          }}>
          <Column width={80}>
            <HeaderCell>
              <Checkbox
                inline
                onChange={onChangeAll}
                indeterminate={someSelected}
                checked={allSelected}
              />
            </HeaderCell>
            <RCell>
              {({id}: FullPollVoteWithAnswerFragment) => {
                return (
                  <Checkbox
                    inline
                    value={id}
                    onChange={onChangeItem}
                    checked={selectedItems.includes(id)}
                  />
                )
              }}
            </RCell>
          </Column>

          <Column width={250} align="left" resizable sortable>
            <HeaderCell>{t('pollVoteList.overview.createdAt')}</HeaderCell>
            <RCell dataKey="createdAt">
              {({createdAt}: FullPollVoteFragment) =>
                `${new Date(createdAt).toLocaleDateString()} ${new Date(
                  createdAt
                ).toLocaleTimeString()}`
              }
            </RCell>
          </Column>
          <Column width={250} align="left" resizable>
            <HeaderCell>{t('pollVoteList.overview.answerId')}</HeaderCell>
            <RCell dataKey="answerId">
              {({answer}: FullPollVoteWithAnswerFragment) => answer.answer}
            </RCell>
          </Column>
          <Column width={250} align="left" resizable>
            <HeaderCell>{t('pollVoteList.overview.userId')}</HeaderCell>
            <RCell dataKey="userId">{({userId}: FullPollVoteFragment) => userId}</RCell>
          </Column>
          <Column width={250} align="left" resizable>
            <HeaderCell>{t('pollVoteList.overview.fingerprint')}</HeaderCell>
            <RCell dataKey="userId">{({fingerprint}: FullPollVoteFragment) => fingerprint}</RCell>
          </Column>
        </Table>
        <Pagination state={listQueryState} totalCount={listQuery?.data?.pollVotes?.totalCount} />
      </TableWrapper>
    </>
  )
}
