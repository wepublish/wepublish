import { ApolloError } from '@apollo/client';
import { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import { mockPoll, mockPollBlock } from '@wepublish/storybook/mocks';
import {
  WithPollBlockDecorators,
  WithUserDecorator,
} from '@wepublish/storybook';
import { PollBlock } from './poll-block';

const pollBlock = mockPollBlock({
  poll: mockPoll({ closedAt: null }),
});

export default {
  component: PollBlock,
  title: 'Blocks/Poll',
} as Meta;

export const Default: StoryObj = {
  args: pollBlock,
  decorators: [WithPollBlockDecorators({})],
};

export const Voting: StoryObj = {
  ...Default,
  decorators: [
    WithUserDecorator({} as any),
    WithPollBlockDecorators({
      fetchUserVoteResult: {
        data: {
          userPollVote: null,
        },
      },
      voteResult: {
        data: {
          voteOnPoll: {
            answerId: pollBlock.poll!.answers[0].id,
            pollId: pollBlock.poll!.id,
          },
        },
      },
    }),
  ],
};

export const VotingPlay: StoryObj = {
  ...Voting,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    const button = canvas.getByText(pollBlock.poll!.answers[0].answer!, {
      selector: 'button',
    });

    await step('Vote', async () => {
      await userEvent.click(button);
    });
  },
};

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
            answerId: pollBlock.poll!.answers[0].id,
            pollId: pollBlock.poll!.id,
          },
        },
      },
    }),
  ],
};

export const AnonymousVotingPlay: StoryObj = {
  ...AnonymousVoting,
  play: VotingPlay.play,
};

export const AlreadyVoted: StoryObj = {
  ...Default,
  decorators: [
    WithUserDecorator({} as any),
    WithPollBlockDecorators({
      fetchUserVoteResult: {
        data: {
          userPollVote: pollBlock.poll!.answers[1].id,
        },
      },
    }),
  ],
};

export const AnonymousAlreadyVoted: StoryObj = {
  ...Default,
  decorators: [
    WithUserDecorator({} as any),
    WithPollBlockDecorators({
      canVoteAnonymously: true,
      anonymousVoteResult: pollBlock.poll!.answers[1].id,
    }),
  ],
};

export const VotingClosed: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    poll: {
      ...pollBlock.poll,
      closedAt: pollBlock.poll!.opensAt,
    },
  },
  decorators: [
    WithUserDecorator({} as any),
    WithPollBlockDecorators({
      fetchUserVoteResult: {
        data: {
          userPollVote: null,
        },
      },
    }),
  ],
};

export const WithError: StoryObj = {
  ...Default,
  decorators: [
    WithUserDecorator({} as any),
    WithPollBlockDecorators({
      fetchUserVoteResult: {
        data: undefined,
        error: new ApolloError({
          errorMessage: 'Something went wrong with the user vote.',
        }),
      },
      voteResult: {
        data: undefined,
        error: new ApolloError({
          errorMessage: 'Something went wrong with the poll vote.',
        }),
      },
    }),
  ],
  play: VotingPlay.play,
};

export const WithoutPoll: StoryObj = {
  args: {},
};
