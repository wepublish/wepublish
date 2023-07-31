import {FetchResult, LazyQueryExecFunction, MutationFunctionOptions} from '@apollo/client'
import {useUser} from '@wepublish/authentication/website'
import {
  PollVoteMutation,
  PollVoteMutationVariables,
  UserPollVoteQuery,
  UserPollVoteQueryVariables
} from '@wepublish/website/api'
import {createContext, useContext} from 'react'

export const PollBlockContext = createContext<
  Partial<{
    fetchUserVote: LazyQueryExecFunction<UserPollVoteQuery, UserPollVoteQueryVariables>
    vote: (
      options: MutationFunctionOptions<PollVoteMutation, PollVoteMutationVariables>
    ) => Promise<FetchResult<PollVoteMutation>>
  }>
>({})

export const usePollBlock = () => {
  const {hasUser} = useUser()
  const {fetchUserVote, vote} = useContext(PollBlockContext)

  if (hasUser && (!fetchUserVote || !vote)) {
    throw new Error('PollBlockContext has not been fully provided.')
  }

  return {fetchUserVote: fetchUserVote!, vote: vote!}
}
