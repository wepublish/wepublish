import { ApolloError } from '@apollo/client';
import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { userEvent, waitFor, within } from '@storybook/test';
import {
  mockChallenge,
  mockComment,
  mockUser,
} from '@wepublish/storybook/mocks';
import {
  WithCommentRatingsDecorators,
  WithUserDecorator,
} from '@wepublish/storybook';
import { Challenge, CommentAuthorType } from '@wepublish/website/api';
import { ComponentProps, useReducer } from 'react';
import { CommentList } from './comment-list';
import { commentListReducer } from './comment-list.state';

const challenge = mockChallenge() as Challenge;

const verifiedUserComment = mockComment({
  id: '1',
  user: mockUser(),
  guestUsername: null,
  guestUserImage: null,
  authorType: CommentAuthorType.VerifiedUser,
});

const nestedChildren = (id: string) => [
  {
    ...verifiedUserComment,
    id: `${id}-1`,
    children: [{ ...verifiedUserComment, id: `${id}-1-1` }],
  },
  mockComment({
    id: `${id}-2`,
    children: [{ ...verifiedUserComment, id: `${id}-2-1` }],
  }),
];

// Custom render function for passing down the reducer
function Render(props: ComponentProps<typeof CommentList>) {
  const [openCommentEditors, dispatch] = useReducer(commentListReducer, {});

  return (
    <CommentList
      {...props}
      openEditorsState={openCommentEditors}
      openEditorsStateDispatch={dispatch}
    />
  );
}

export default {
  component: Render,
  title: 'Components/Comment List',
} as Meta;

export const Default: StoryObj = {
  args: {
    data: {
      comments: [
        verifiedUserComment,
        { ...verifiedUserComment, children: nestedChildren('2'), id: '2' },
        { ...mockComment({ id: '3' }), children: nestedChildren('3') },
        { ...verifiedUserComment, id: '4' },
        { ...mockComment({ id: '5' }), children: nestedChildren('5') },
        { ...verifiedUserComment, children: nestedChildren('6'), id: '6' },
      ],
      ratingSystem: {
        answers: [],
        id: '1234',
        name: 'default',
      },
    },
    variables: {},
    onVariablesChange: action('onVariablesChange'),
    challenge: {
      data: { challenge },
    },
    maxCommentLength: 2000,
    add: {},
    edit: {},
  },
  decorators: [WithCommentRatingsDecorators({})],
};

export const Empty: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    data: {
      comments: [],
    },
  },
};

export const Commenting: StoryObj = {
  ...Default,
  decorators: [
    WithCommentRatingsDecorators({}),
    WithUserDecorator(verifiedUserComment.user ?? null),
  ],
};

export const CommentingOpen: StoryObj = {
  ...Commenting,
  decorators: [
    WithCommentRatingsDecorators({}),
    WithUserDecorator(verifiedUserComment.user ?? null),
  ],
  play: async ctx => {
    const { canvasElement, step } = ctx;
    const canvas = within(canvasElement);
    const submitButton = canvas.getByText('Jetzt Mitreden');

    await step('Open comment editor', async () => {
      await userEvent.click(submitButton);
      await waitFor(() => canvas.getByLabelText('Titel'));
    });
  },
};

export const AnonymousCommenting: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    anonymousCanComment: true,
  },
};

export const AnonymousCommentingOpen: StoryObj = {
  ...AnonymousCommenting,
  play: async ctx => {
    const { canvasElement, step } = ctx;
    const canvas = within(canvasElement);
    const fullScope = within(document.body);
    const submitButton = canvas.getByText('Jetzt Mitreden');

    await step('Open comment editor', async () => {
      await userEvent.click(submitButton);
    });

    // Use fullScope to find the modal elements
    const commentAsGuestButton = await fullScope.findByText(
      /als gast kommentieren/i
    );

    await step('Close modal', async () => {
      await userEvent.click(commentAsGuestButton);
    });

    await waitFor(() => canvas.getByLabelText('Titel'));
  },
};

export const WithLoading: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    data: undefined,
    loading: true,
  },
};

export const WithError: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    data: undefined,
    loading: false,
    error: new ApolloError({
      errorMessage: 'Foobar',
    }),
  },
};
