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

const WithPollBlockDecorators =
  (
    fetchUserVoteResult?: Pick<UserPollVoteQueryResult, 'data' | 'error'>,
    voteResult?: Pick<PollVoteMutationResult, 'data' | 'error'>
  ) =>
  (Story: ComponentType) => {
    const vote = async (args: unknown) => {
      action('vote')(args)

      return voteResult || {}
    }

    const fetchUserVote = async (args: unknown) => {
      action('fetchUserVote')(args)

      return fetchUserVoteResult || {}
    }

    return (
      <PollBlockContext.Provider value={{vote, fetchUserVote} as any}>
        <Story />
      </PollBlockContext.Provider>
    )
  }

export default {
  component: PollBlock,
  title: 'Blocks/Poll',
  decorators: [WithPollBlockDecorators()]
} as Meta

export const Default: StoryObj = {
  args: {
    poll
  }
}

export const Closed: StoryObj = {
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
      data: {
        userPollVote: null
      }
    })
  ]
}

export const Voting: StoryObj = {
  ...Default,
  decorators: [
    WithUserDecorator,
    WithPollBlockDecorators(
      {
        data: {
          userPollVote: null
        }
      },
      {
        data: {
          voteOnPoll: {
            answerId: poll.answers[0].id
          }
        }
      }
    )
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

export const AlreadyVoted: StoryObj = {
  ...Default,
  decorators: [
    WithUserDecorator,
    WithPollBlockDecorators({
      data: {
        userPollVote: poll.answers[1].id
      }
    })
  ]
}

export const WithError: StoryObj = {
  ...Default,
  decorators: [
    WithUserDecorator,
    WithPollBlockDecorators(
      {
        data: undefined,
        error: new ApolloError({
          errorMessage: 'Something went wrong with the user vote.'
        })
      },
      {
        data: undefined,
        error: new ApolloError({
          errorMessage: 'Something went wrong with the poll vote.'
        })
      }
    )
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
