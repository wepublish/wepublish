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
  TableWrapper
} from '@wepublish/ui/editor'
import {useTranslation} from 'react-i18next'
import {Table as RTable} from 'rsuite'

const {Column, HeaderCell, Cell: RCell} = RTable

type PollVotesListProps = {
  listQueryState: QueryState<PollVoteListQueryVariables>
  listQuery: PollVoteListQueryResult
  pollQuery: PollQueryResult
}

export function PollVoteList({listQueryState, listQuery, pollQuery}: PollVotesListProps) {
  const {sortField, setSortField, sortOrder, setSortOrder, filter, setFilter} = listQueryState
  const {t} = useTranslation()

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{pollQuery?.data?.poll?.question || t('pollList.noQuestion')}</h2>
        </ListViewHeader>
        <ListFilters
          fields={['dates', 'answerIds']}
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
          <Column width={250} align="left" resizable sortable>
            <HeaderCell>{t('pollVoteList.overview.createdAt')}</HeaderCell>
            <RCell dataKey="createdAt">{({createdAt}: FullPollVoteFragment) => createdAt}</RCell>
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
