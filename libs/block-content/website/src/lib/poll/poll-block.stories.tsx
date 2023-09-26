import {ApolloError} from '@apollo/client'
import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'
import {Meta, StoryObj} from '@storybook/react'
import {userEvent, within} from '@storybook/testing-library'
import {
  FullPollFragment,
  PollVoteMutationResult,
  UserPollVoteQueryResult
} from '@wepublish/website/api'
import {ComponentType} from 'react'
import {Node} from 'slate'
import {PollBlock} from './poll-block'
import {PollBlockContext} from './poll-block.context'
import {WithUserDecorator} from '@wepublish/storybook'

const text: Node[] = [
  {
    type: 'paragraph',
    children: [
      {
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
      }
    ]
  }
]

const poll = {
  __typename: 'FullPoll',
  id: '1234',
  question: 'Question',
  infoText: text,
  externalVoteSources: [
    {
      id: '1234',
      voteAmounts: [
        {
          id: '1',
          __typename: 'PollExternalVote',
          amount: 10,
          answerId: '1234'
        },
        {
          id: '2',
          __typename: 'PollExternalVote',
          amount: 5,
          answerId: '1234-1234'
        }
      ]
    }
  ],
  opensAt: '2023-01-01',
  closedAt: '2033-01-01',
  answers: [
    {
      id: '1234',
      pollId: '1234',
      votes: 1,
      answer: 'Ja'
    },
    {
      id: '1234-1234',
      pollId: '1234',
      votes: 5,
      answer: 'Nein'
    }
  ]
} as FullPollFragment

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
    WithUserDecorator({} as any),
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
    WithUserDecorator({} as any),
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
    WithUserDecorator({} as any),
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
    WithUserDecorator({} as any),
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
    WithUserDecorator({} as any),
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
    WithUserDecorator({} as any),
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
