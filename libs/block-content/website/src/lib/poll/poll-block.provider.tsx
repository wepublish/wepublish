import {useUser} from '@wepublish/authentication/website'
import {
  PollVoteMutation,
  PollVoteMutationVariables,
  SettingName,
  usePollVoteMutation,
  useSettingListQuery,
  useUserPollVoteLazyQuery
} from '@wepublish/website/api'
import {PropsWithChildren, useMemo} from 'react'
import {PollBlockContext} from './poll-block.context'
import {FetchResult, MutationFunctionOptions} from '@apollo/client'

const getAnonymousVote = (pollId: string): string | null =>
  typeof localStorage !== 'undefined' ? localStorage.getItem(`poll-vote:${pollId}`) : null

const setAnonymousVote = (pollId: string, answerId: string) =>
  typeof localStorage !== 'undefined' ? localStorage.setItem(`poll-vote:${pollId}`, answerId) : null

export function PollBlockProvider({children}: PropsWithChildren) {
  const {hasUser} = useUser()
  const [fetchUserVote] = useUserPollVoteLazyQuery()
  const [voteMutation] = usePollVoteMutation({
    onCompleted(data, clientOptions) {
      if (data.voteOnPoll && !hasUser) {
        setAnonymousVote(data.voteOnPoll.pollId, data.voteOnPoll.answerId)
      }
    }
  })
  const {data: settings} = useSettingListQuery()

  const canVoteAnonymously = useMemo(
    () =>
      !!settings?.settings.find(setting => setting.name === SettingName.AllowGuestPollVoting)
        ?.value,
    [settings?.settings]
  )

  async function vote(
    options: MutationFunctionOptions<PollVoteMutation, PollVoteMutationVariables>,
    pollId: string
  ): Promise<FetchResult<PollVoteMutation> | undefined> {
    // if user provided, API handels the voting permissions
    if (hasUser) {
      return await voteMutation(options)
    }

    // user is not allowed to vote anonymously
    if (!canVoteAnonymously) {
      return
    }

    // anonymous user already voted on that poll
    if (getAnonymousVote(pollId)) {
      return
    }

    // else, vote is possible anonymously
    return voteMutation(options)
  }

  return (
    <PollBlockContext.Provider
      value={{
        fetchUserVote,
        vote,
        canVoteAnonymously,
        getAnonymousVote
      }}>
      {children}
    </PollBlockContext.Provider>
  )
}
