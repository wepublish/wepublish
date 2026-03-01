import { ApolloError } from '@apollo/client';
import { action } from '@storybook/addon-actions';
import { useArgs, useReducer } from '@storybook/preview-api';
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
import {
  Challenge,
  CommentAuthorType,
  CommentListQuery,
  SensitiveDataUser,
} from '@wepublish/website/api';
import { ComponentProps } from 'react';
import { LoggedInFilled } from '../comment-editor/comment-editor.stories';
import { CommentListItem } from './comment-list-item';
import { commentListReducer } from './comment-list.state';
import nanoid from 'nanoid';

const challenge = mockChallenge() as Challenge;

const anonymousComment = mockComment({
  id: '1',
});

const verifiedUserComment = mockComment({
  id: '2',
  user: mockUser(),
  guestUsername: null,
  guestUserImage: null,
  authorType: CommentAuthorType.VerifiedUser,
});

const ratingSystem = {
  id: nanoid(),
  __typename: 'CommentRatingSystem',
  name: 'Default',
  answers: anonymousComment.userRatings.map(rating => rating.answer),
} as CommentListQuery['ratingSystem'];

// Custom render function as Storybook passes the children down as render props
// Also for passing down the reducer
function Render() {
  const [args] = useArgs();
  const [openCommentEditors, dispatch] = useReducer(commentListReducer, {});
  const props = args as ComponentProps<typeof CommentListItem>;

  return (
    <CommentListItem
      {...props}
      openEditorsState={openCommentEditors}
      openEditorsStateDispatch={dispatch}
    />
  );
}

const openAddEditor: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);
  const submitButton = canvas.getByText('Antworten');

  await step('Open comment editor', async () => {
    await userEvent.click(submitButton);
    await waitFor(() => canvas.getByLabelText('Titel'));
  });
};

const openEditEditor: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);
  const submitButton = canvas.getByText('Editieren');

  await step('Open comment editor', async () => {
    await userEvent.click(submitButton);
  });

  await waitFor(() => canvas.getByLabelText('Titel'));
};

export default {
  component: CommentListItem,
  title: 'Components/Comment List/Item',
  render: Render,
} as Meta;

export const Default: StoryObj = {
  args: {
    ...verifiedUserComment,
    challenge: {
      loading: false,
      data: { challenge },
    },
    maxCommentLength: 2000,
    ratingSystem,
    onEditComment: action('onEditComment'),
    onADdComment: action('onAddComment'),
    add: {},
    edit: {},
  },
  decorators: [WithCommentRatingsDecorators({})],
};

export const Commenting: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
  },
  decorators: [
    WithCommentRatingsDecorators({}),
    WithUserDecorator((verifiedUserComment.user as SensitiveDataUser) ?? null),
  ],
};

export const AnonymousCommenting: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    anonymousCanComment: true,
  },
};

export const CommentingWithError: StoryObj = {
  ...Commenting,
  args: {
    ...Commenting.args,
    add: {
      error: new ApolloError({
        errorMessage: 'Something went wrong.',
      }),
    },
  },
  parameters: {
    chromatic: { disableSnapshot: true }, // play function triggers unhandled errors in headless Chrome
  },
  play: async ctx => {
    await openAddEditor(ctx);
    await LoggedInFilled.play?.(ctx);
  },
};

export const Editing: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    userCanEdit: true,
  },
  decorators: [
    WithCommentRatingsDecorators({}),
    WithUserDecorator((verifiedUserComment.user as SensitiveDataUser) ?? null),
  ],
};

export const EditingWithError: StoryObj = {
  ...Editing,
  args: {
    ...Editing.args,
    edit: {
      error: new ApolloError({
        errorMessage: 'Something went wrong.',
      }),
    },
  },
  play: async ctx => {
    await openEditEditor(ctx);
    await LoggedInFilled.play?.(ctx);
  },
};

export const Nested: StoryObj = {
  ...Editing,
  args: {
    ...Editing.args,
    children: [
      {
        ...verifiedUserComment,
        challenge: {
          data: { challenge },
        },
        maxCommentLength: 2000,
        children: [anonymousComment],
      },
      {
        ...anonymousComment,
        maxCommentLength: 2000,
        children: [verifiedUserComment],
      },
    ],
  },
};

export const MaxNesting: StoryObj = {
  ...Editing,
  args: {
    ...Editing.args,
    commentDepth: 0,
    maxCommentDepth: 1,
    children: [
      {
        ...verifiedUserComment,
        challenge: {
          data: { challenge },
        },
        maxCommentLength: 2000,
        children: [],
      },
      {
        ...anonymousComment,
        maxCommentLength: 2000,
        children: [],
      },
    ],
  },
};
