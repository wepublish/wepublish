import {ApolloError} from '@apollo/client'
import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'
import {Meta, StoryObj} from '@storybook/react'
import {userEvent, within} from '@storybook/testing-library'
import {SessionTokenContext} from '@wepublish/authentication/website'
import {PollVoteMutationResult, UserPollVoteQueryResult} from '@wepublish/website/api'
import {ComponentType} from 'react'
import {PollBlock} from './poll-block'
import {PollBlockContext} from './poll-block.context'
import {poll} from '@wepublish/testing/fixtures/graphql'

const WithUserDecorator = (Story: ComponentType) => {
  return (
    <SessionTokenContext.Provider
      value={[
        {} as any,
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

const WithPollBlockDecorators =
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

export default {
  component: PollBlock,
  title: 'Blocks/Poll',
  decorators: [WithPollBlockDecorators({})]
} as Meta

export const Default: StoryObj = {
  args: {
    poll
  }
}

export const Voting: StoryObj = {
  ...Default,
  decorators: [
    WithUserDecorator,
    WithPollBlockDecorators({
      fetchUserVoteResult: {
        data: {
          userPollVote: null
        }
      },
      voteResult: {
        data: {
          voteOnPoll: {
            answerId: poll.answers[0].id,
            pollId: poll.id
          }
        }
      }
    })
  ]
}

export const VotingPlay: StoryObj = {
  ...Voting,
  play: async ({canvasElement, step}) => {
    const canvas = within(canvasElement)

    const button = canvas.getByText('Ja', {
      selector: 'button'
    })

    await step('Vote', async () => {
      await userEvent.click(button)
    })
  }
}

export const AnonymousVoting: StoryObj = {
  ...Default,
  decorators: [
    WithUserDecorator,
    WithPollBlockDecorators({
      canVoteAnonymously: true,
      anonymousVoteResult: undefined,
      voteResult: {
        data: {
          voteOnPoll: {
            answerId: poll.answers[0].id,
            pollId: poll.id
          }
        }
      }
    })
  ]
}

export const AnonymousVotingPlay: StoryObj = {
  ...AnonymousVoting,
  play: VotingPlay.play
}

export const AlreadyVoted: StoryObj = {
  ...Default,
  decorators: [
    WithUserDecorator,
    WithPollBlockDecorators({
      fetchUserVoteResult: {
        data: {
          userPollVote: poll.answers[1].id
        }
      }
    })
  ]
}

export const AnonymousAlreadyVoted: StoryObj = {
  ...Default,
  decorators: [
    WithUserDecorator,
    WithPollBlockDecorators({
      canVoteAnonymously: true,
      anonymousVoteResult: poll.answers[1].id
    })
  ]
}

export const VotingClosed: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    poll: {
      ...poll,
      closedAt: poll.opensAt
    }
  },
  decorators: [
    WithUserDecorator,
    WithPollBlockDecorators({
      fetchUserVoteResult: {
        data: {
          userPollVote: null
        }
      }
    })
  ]
}

export const WithError: StoryObj = {
  ...Default,
  decorators: [
    WithUserDecorator,
    WithPollBlockDecorators({
      fetchUserVoteResult: {
        data: undefined,
        error: new ApolloError({
          errorMessage: 'Something went wrong with the user vote.'
        })
      },
      voteResult: {
        data: undefined,
        error: new ApolloError({
          errorMessage: 'Something went wrong with the poll vote.'
        })
      }
    })
  ],
  play: VotingPlay.play
}

export const WithClassName: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}

export const WithEmotion: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    css: css`
      background-color: #eee;
    `
  }
}

export const WihtoutPoll: StoryObj = {
  args: {}
}
