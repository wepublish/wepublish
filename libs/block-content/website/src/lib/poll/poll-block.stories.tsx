import {css} from '@emotion/react'
import {Meta, StoryObj} from '@storybook/react'
import {FullPollFragment, PollVoteDocument, UserPollVoteDocument} from '@wepublish/website/api'
import {PollBlock} from './poll-block'
import {Node} from 'slate'
import {SessionTokenContext} from '@wepublish/authentication/website'
import {ComponentType} from 'react'
import {userEvent, within} from '@storybook/testing-library'
import {ApolloError} from '@apollo/client'

export default {
  component: PollBlock,
  title: 'Blocks/Poll'
} as Meta

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
  decorators: [WithUserDecorator],
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: UserPollVoteDocument,
            variables: {
              pollId: poll.id
            }
          },
          result: {
            data: {
              userPollVote: null
            }
          }
        }
      ]
    }
  }
}

export const Voting: StoryObj = {
  ...Default,
  decorators: [WithUserDecorator],
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: UserPollVoteDocument,
            variables: {
              pollId: poll.id
            }
          },
          result: {
            data: {
              userPollVote: null
            }
          }
        },
        {
          request: {
            query: PollVoteDocument,
            variables: {
              answerId: poll.answers[0].id
            }
          },
          result: {
            data: {
              voteOnPoll: {
                answerId: poll.answers[0].id
              }
            }
          }
        },
        {
          request: {
            query: PollVoteDocument,
            variables: {
              answerId: poll.answers[1].id
            }
          },
          result: {
            data: {
              voteOnPoll: {
                answerId: poll.answers[1].id
              }
            }
          }
        }
      ]
    }
  }
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
  decorators: [WithUserDecorator],
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: UserPollVoteDocument,
            variables: {
              pollId: poll.id
            }
          },
          result: {
            data: {
              userPollVote: poll.answers[1].id
            }
          }
        }
      ]
    }
  }
}

export const WithError: StoryObj = {
  ...Default,
  decorators: [WithUserDecorator],
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: UserPollVoteDocument,
            variables: {
              pollId: poll.id
            }
          },
          result: {
            errors: [
              new ApolloError({
                errorMessage: 'Something went wrong with the user vote.'
              })
            ]
          }
        },
        {
          request: {
            query: PollVoteDocument,
            variables: {
              answerId: poll.answers[0].id
            }
          },
          result: {
            errors: [
              new ApolloError({
                errorMessage: 'Something went wrong with the poll vote.'
              })
            ]
          }
        }
      ]
    }
  },
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
