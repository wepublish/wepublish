import {useUser} from '@wepublish/authentication/website'
import {
  SettingName,
  usePollVoteMutation,
  useSettingListQuery,
  useUserPollVoteLazyQuery
} from '@wepublish/website/api'
import {PropsWithChildren, useMemo} from 'react'
import {PollBlockContext} from './poll-block.context'

const getAnonymousVote = (pollId: string): string | null =>
  typeof localStorage !== 'undefined' ? localStorage.getItem(`poll-vote:${pollId}`) : null

const setAnonymousVote = (pollId: string, answerId: string) =>
  typeof localStorage !== 'undefined' ? localStorage.setItem(`poll-vote:${pollId}`, answerId) : null

export function PollBlockProvider({children}: PropsWithChildren) {
  const {hasUser} = useUser()
  const [fetchUserVote] = useUserPollVoteLazyQuery()
  const [vote] = usePollVoteMutation({
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
