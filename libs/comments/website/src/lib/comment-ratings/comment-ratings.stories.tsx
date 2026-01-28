import { Meta, StoryObj } from '@storybook/react';
import { CommentRatings } from './comment-ratings';
import { CommentRatingSystemAnswer } from '@wepublish/website/api';
import { mockCommentRatingAnswer } from '@wepublish/storybook/mocks';
import {
  WithCommentRatingsDecorators,
  WithUserDecorator,
} from '@wepublish/storybook';
import { userEvent, within } from '@storybook/test';
import { ComponentProps } from 'react';
import { useArgs } from '@storybook/preview-api';
import { CommentRatingContext } from './comment-ratings.context';

export default {
  component: CommentRatings,
  title: 'Components/Comment Ratings',
} as Meta;

const answers: CommentRatingSystemAnswer[] = [
  mockCommentRatingAnswer({ answer: 'Foobar' }),
  mockCommentRatingAnswer({ answer: 'Barfoo' }),
  mockCommentRatingAnswer({ answer: 'Foobaz' }),
];

export const Default = {
  args: {
    commentId: '1234',
    calculatedRatings: [
      {
        mean: 4.5,
        count: 10,
        total: 45,
        answer: answers[0],
      },
      {
        mean: 2.5,
        count: 10,
        total: 25,
        answer: answers[1],
      },
      {
        mean: 1.9,
        count: 10,
        total: 19,
        answer: answers[2],
      },
    ],
    overriddenRatings: [],
    userRatings: [],
    ratingSystem: {
      id: '1234-1234',
      name: 'Default',
      answers,
    },
  },
  decorators: [WithCommentRatingsDecorators({}), WithUserDecorator(null)],
} as StoryObj<typeof CommentRatings>;

export const Single = {
  ...Default,
  args: {
    ...Default.args,
    ratingSystem: {
      ...Default.args?.ratingSystem,
      answers: [Default.args?.ratingSystem?.answers[0]],
    },
  },
} as StoryObj<typeof CommentRatings>;

export const Empty = {
  ...Default,
  args: {
    ...Default.args,
    ratingSystem: {
      ...Default.args?.ratingSystem,
      answers: [],
    },
  },
} as StoryObj<typeof CommentRatings>;

export const OverridenRatings = {
  ...Default,
  args: {
    ...Default.args,
    overriddenRatings: [
      {
        answerId: answers[0].id,
        value: 1.2,
      },
      {
        answerId: answers[1].id,
        value: 2.4,
      },
      {
        answerId: answers[2].id,
        value: 3.5,
      },
    ],
  },
} as StoryObj<typeof CommentRatings>;

export const UserRatings = {
  ...Default,
  args: {
    ...Default.args,
    userRatings: [
      {
        commentId: '1234',
        answer: answers[0],
        value: 2,
        createdAt: new Date('2023-01-01').toISOString(),
        id: '111-111',
      },
      {
        commentId: '1234',
        answer: answers[1],
        value: 3,
        createdAt: new Date('2023-01-01').toISOString(),
        id: '222-222',
      },
      {
        commentId: '1234',
        answer: answers[2],
        value: 5,
        createdAt: new Date('2023-01-01').toISOString(),
        id: '333-333',
      },
    ],
  },
} as StoryObj<typeof CommentRatings>;

export const AnonymousUserRatings = {
  ...Default,
  decorators: [
    WithCommentRatingsDecorators({
      canRateAnonymously: true,
      anonymousRateResult: (commentId: string, answerId: string) => {
        if (answerId === answers[0].id) {
          return 1;
        }

        if (answerId === answers[1].id) {
          return 2;
        }

        if (answerId === answers[2].id) {
          return 3;
        }

        return 0;
      },
    }),
  ],
} as StoryObj<typeof CommentRatings>;

export const ReadOnly = {
  ...Default,
  decorators: [
    WithCommentRatingsDecorators({
      canRateAnonymously: false,
    }),
  ],
} as StoryObj<typeof CommentRatings>;

export const Rate = {
  ...Single,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    const button = canvas.getByLabelText('4 Stars', {
      exact: false,
    });

    await step('Click Star', async () => {
      await userEvent.click(button);
    });
  },
  render: function Render() {
    const [args, updateArgs] = useArgs<ComponentProps<typeof CommentRatings>>();

    return (
      <CommentRatingContext.Provider
        value={{
          rate: async ({ variables }) => {
            updateArgs({
              userRatings: [
                {
                  answer: args.ratingSystem.answers.find(
                    ({ id }) => id === variables?.answerId
                  )!,
                  commentId: variables!.commentId,
                  createdAt: new Date('2023-01-01').toISOString(),
                  id: '123',
                  value: variables!.value,
                },
              ],
            });

            return {};
          },
        }}
      >
        <CommentRatings {...args} />
      </CommentRatingContext.Provider>
    );
  },
  decorators: [WithUserDecorator(null)],
} as StoryObj<typeof CommentRatings>;

export const WithRateError = {
  ...Single,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    const button = canvas.getByLabelText('4 Stars', {
      exact: false,
    });

    await step('Click Star', async () => {
      await userEvent.click(button);
    });
  },
  render: function Render(args) {
    return (
      <CommentRatingContext.Provider
        value={{
          rate: async () => {
            throw new Error('Something went wrong.');
          },
        }}
      >
        <CommentRatings {...args} />
      </CommentRatingContext.Provider>
    );
  },
  decorators: [WithUserDecorator(null)],
} as StoryObj<typeof CommentRatings>;
