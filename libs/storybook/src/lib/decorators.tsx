import NextScript from 'next/script'
import {CssBaseline} from '@mui/material'
import {Preview} from '@storybook/react'
import {ComponentType, PropsWithChildren, memo, useCallback, useState} from 'react'
import {
  PollVoteMutationResult,
  RateCommentMutationResult,
  User,
  UserPollVoteQueryResult,
  SessionWithTokenWithoutUser
} from '@wepublish/website/api'
import {action} from '@storybook/addon-actions'
import {SessionTokenContext} from '@wepublish/authentication/website'
import {PollBlockContext} from '@wepublish/block-content/website'
import {CommentRatingContextProps, CommentRatingContext} from '@wepublish/comments/website'
import {WebsiteProvider} from '@wepublish/website'
import {WebsiteBuilderProvider} from '@wepublish/website/builder'

const SessionProvider = memo<PropsWithChildren>(({children}) => {
  const [token, setToken] = useState<SessionWithTokenWithoutUser | null>()
  const [user, setUser] = useState<User | null>(null)

  const setTokenAndGetMe = useCallback((newToken: SessionWithTokenWithoutUser | null) => {
    setToken(newToken)

    if (newToken) {
      setUser({
        id: '1234-1234',
        firstName: 'Foo',
        name: 'Bar',
        email: 'foobar@example.com',
        paymentProviderCustomers: [],
        properties: [],
        permissions: []
      })
    } else {
      setUser(null)
    }
  }, [])

  return (
    <SessionTokenContext.Provider value={[user, !!token, setTokenAndGetMe]}>
      {children}
    </SessionTokenContext.Provider>
  )
})

const Head = ({children}: PropsWithChildren) => <div data-testid="fake-head">{children}</div>
const Script = ({children, ...data}: PropsWithChildren<any>) => (
  <>
    {/* we use next/script, but also include <script /> tag for snapshots */}
    <NextScript {...data}>{children}</NextScript>
    <script data-testid="fake-script" {...data}>
      {children}
    </script>
  </>
)

const withWebsiteProvider = (Story: ComponentType) => (
  <WebsiteProvider>
    <WebsiteBuilderProvider Head={Head} Script={Script}>
      <SessionProvider>
        <CssBaseline />
        <Story />
      </SessionProvider>
    </WebsiteBuilderProvider>
  </WebsiteProvider>
)

export const decorators = [withWebsiteProvider] as Preview['decorators']

export const WithUserDecorator = (user: User | null) => (Story: ComponentType) => {
  return (
    <SessionTokenContext.Provider
      value={[
        user,
        true,
        () => {
          /* do nothing */
        }
      ]}>
      <Story />
    </SessionTokenContext.Provider>
  )
}

type PollDecoratorProps = Partial<{
  fetchUserVoteResult: Pick<UserPollVoteQueryResult, 'data' | 'error'>
  voteResult: Pick<PollVoteMutationResult, 'data' | 'error'>
  anonymousVoteResult: string
  canVoteAnonymously: boolean
}>

export const WithPollBlockDecorators =
  ({
    anonymousVoteResult,
    canVoteAnonymously,
    fetchUserVoteResult,
    voteResult
  }: PollDecoratorProps) =>
  (Story: ComponentType) => {
    const vote = async (args: unknown) => {
      action('vote')(args)

      return voteResult || {}
    }

    const fetchUserVote = async (args: unknown): Promise<any> => {
      action('fetchUserVote')(args)

      return fetchUserVoteResult || {}
    }

    const getAnonymousVote = (args: unknown): string | null => {
      action('getAnonymousVote')(args)

      return anonymousVoteResult ?? null
    }

    return (
      <PollBlockContext.Provider
        value={{
          vote,
          fetchUserVote,
          canVoteAnonymously,
          getAnonymousVote
        }}>
        <Story />
      </PollBlockContext.Provider>
    )
  }

type CommentRatingsDecoratorProps = Partial<{
  rateResult: Pick<RateCommentMutationResult, 'data' | 'error'>
  anonymousRateResult: CommentRatingContextProps['getAnonymousRate']
  canRateAnonymously: boolean
}>

export const WithCommentRatingsDecorators =
  ({anonymousRateResult, canRateAnonymously, rateResult}: CommentRatingsDecoratorProps) =>
  (Story: ComponentType) => {
    const rate = async (args: unknown) => {
      action('rate')(args)

      return rateResult || {}
    }

    const getAnonymousRate = (
      ...args: Parameters<NonNullable<typeof anonymousRateResult>>
    ): number | null => {
      action('getAnonymousRate')(args)

      return anonymousRateResult?.(...args) ?? null
    }

    return (
      <CommentRatingContext.Provider
        value={{
          rate,
          canRateAnonymously,
          getAnonymousRate
        }}>
        <Story />
      </CommentRatingContext.Provider>
    )
  }
