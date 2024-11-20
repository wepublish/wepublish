import {usePollQuery} from '@wepublish/editor/api'
import {
  getApiClientV2,
  PollVoteListQueryResult,
  PollVoteSort,
  SortOrder as SortOrderV2,
  useDeletePollVotesMutation,
  usePollVoteListQuery
} from '@wepublish/editor/api-v2'
import {
  createCheckedPermissionComponent,
  createOptionalMapper,
  usePaginatedQueryContainer
} from '@wepublish/ui/editor'
import {useMemo} from 'react'
import {useParams} from 'react-router-dom'

import {PollVoteList} from './PollVoteList'

function PollVoteListContainer() {
  const {pollId} = useParams()
  const {state, variables} = usePaginatedQueryContainer<PollVoteListQueryResult>({
    filter: {pollId},
    limit: 100,
    sortMapper: createOptionalMapper({createdAt: PollVoteSort.CreatedAt}),
    orderMapper: createOptionalMapper({
      desc: SortOrderV2.Descending,
      asc: SortOrderV2.Ascending
    })
  })

  const client = useMemo(() => getApiClientV2(), [])
  const listQuery = usePollVoteListQuery({
    client,
    variables,
    fetchPolicy: 'network-only'
  })
  const [deletePollVotes] = useDeletePollVotesMutation({
    client
  })

  const handleDeletePollVotes = async (selectedItems: string[]) => {
    try {
      await deletePollVotes({variables: {ids: selectedItems}})
    } finally {
      await listQuery.refetch()
    }
  }

  const pollQuery = usePollQuery({
    variables: {pollId},
    fetchPolicy: 'network-only'
  })

  return (
    <PollVoteList
      listQueryState={state}
      listQuery={listQuery}
      pollQuery={pollQuery}
      deleteItems={handleDeletePollVotes}
    />
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_POLL',
  'CAN_CREATE_POLL',
  'CAN_UPDATE_POLL',
  'CAN_DELETE_POLL'
])(PollVoteListContainer)
export {CheckedPermissionComponent as PollVoteListContainer}
