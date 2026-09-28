import { useMutation, useQuery } from '@apollo/client/react';
import {
  DeletePollVotesDocument,
  PollDocument,
  PollVoteListDocument,
  PollVoteListQueryVariables,
  PollVoteSort,
  SortOrder as SortOrderV2,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  createOptionalMapper,
  usePaginatedQueryContainer,
} from '@wepublish/ui/editor';
import { useParams } from 'react-router-dom';

import { PollVoteList } from './PollVoteList';

function PollVoteListContainer() {
  const { pollId } = useParams();
  const { state, variables } = usePaginatedQueryContainer<{
    variables: PollVoteListQueryVariables;
  }>({
    filter: { pollId },
    limit: 100,
    sortMapper: createOptionalMapper({ createdAt: PollVoteSort.CreatedAt }),
    orderMapper: createOptionalMapper({
      desc: SortOrderV2.Descending,
      asc: SortOrderV2.Ascending,
    }),
  });

  const listQuery = useQuery(PollVoteListDocument, {
    variables,
  });
  const [deletePollVotes] = useMutation(DeletePollVotesDocument, {});

  const handleDeletePollVotes = async (selectedItems: string[]) => {
    try {
      await deletePollVotes({ variables: { ids: selectedItems } });
    } finally {
      await listQuery.refetch();
    }
  };

  const pollQuery = useQuery(PollDocument, {
    variables: { id: pollId! },
  });

  return (
    <PollVoteList
      listQueryState={state}
      listQuery={listQuery}
      pollQuery={pollQuery}
      deleteItems={handleDeletePollVotes}
    />
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_POLL',
  'CAN_CREATE_POLL',
  'CAN_UPDATE_POLL',
  'CAN_DELETE_POLL',
])(PollVoteListContainer);
export { CheckedPermissionComponent as PollVoteListContainer };
