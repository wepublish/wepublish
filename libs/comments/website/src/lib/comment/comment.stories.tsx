import { Meta, StoryObj } from '@storybook/react';
import { mockComment, mockUser } from '@wepublish/storybook/mocks';
import { WithUserDecorator } from '@wepublish/storybook';
import { CommentState, SensitiveDataUser } from '@wepublish/website/api';
import { Comment } from './comment';

const anonymousComment = mockComment({
  id: '1',
});

const verifiedUserComment = mockComment({
  id: '2',
  user: mockUser(),
});

export default {
  component: Comment,
  title: 'Components/Comment',
} as Meta;

const Default: StoryObj = {
  args: {},
};

export const VerifiedUser: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    ...verifiedUserComment,
  },
};

export const AnonymousUser: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    ...anonymousComment,
  },
};

export const WithoutImage: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    ...verifiedUserComment,
    guestUserImage: null,
    user: {
      ...verifiedUserComment.user,
      image: null,
    },
  },
};

export const WithoutFlair: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    ...verifiedUserComment,
    user: {
      ...verifiedUserComment.user,
      flair: null,
    },
  },
};

export const WithoutSource: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    ...verifiedUserComment,
    source: null,
    user: {
      ...verifiedUserComment.user,
      flair: null,
    },
  },
};

export const PendingApproval: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    ...verifiedUserComment,
    state: CommentState.PendingApproval,
  },
};

export const PendingUserChanges: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    ...verifiedUserComment,
    state: CommentState.PendingUserChanges,
  },
  decorators: [
    WithUserDecorator((verifiedUserComment.user as SensitiveDataUser) ?? null),
  ],
};

export const Rejected: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    ...verifiedUserComment,
    state: CommentState.Rejected,
    rejectionReason: 'Spam',
  },
};
