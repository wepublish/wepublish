import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import {
  Challenge,
  ChallengeDocument,
  CommentAuthorType,
  CommentItemType,
  CommentListDocument,
  CommentListQuery,
  SettingListDocument,
} from '@wepublish/website/api';
import { CommentListContainer } from './comment-list-container';
import {
  mockChallenge,
  mockComment,
  mockUser,
} from '@wepublish/storybook/mocks';

const challenge = mockChallenge() as Challenge;

const settings = [
  {
    id: 'cliahqekg00289lpxqgpyump7',
    name: 'COMMENT_CHAR_LIMIT',
    value: 1000,
    __typename: 'Setting',
  },
  {
    id: 'cliahqekg00309lpxthdcxuqe',
    name: 'ALLOW_COMMENT_EDITING',
    value: true,
    __typename: 'Setting',
  },
  {
    id: 'cliahqekf00029lpx01s7tqqg',
    name: 'ALLOW_GUEST_COMMENTING',
    value: false,
    __typename: 'Setting',
  },
  {
    id: 'cliahqekf00069lpxr3sdhs25',
    name: 'ALLOW_GUEST_POLL_VOTING',
    value: false,
    __typename: 'Setting',
  },
  {
    id: 'cliahqekf00049lpx76jxhjqk',
    name: 'ALLOW_GUEST_COMMENT_RATING',
    value: false,
    __typename: 'Setting',
  },
];

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

const nestedChildren = (id: string) => [
  {
    ...verifiedUserComment,
    id: `${id}-1`,
    children: [{ ...verifiedUserComment, id: `${id}-1-1` }],
  },
  {
    ...anonymousComment,
    id: `${id}-2`,
    children: [{ ...verifiedUserComment, id: `${id}-2-1` }],
  },
];

const comments = [
  { ...verifiedUserComment },
  { ...verifiedUserComment, children: nestedChildren('1'), id: '3' },
  { ...anonymousComment, children: nestedChildren('2'), id: '4' },
  { ...verifiedUserComment, id: '5' },
  { ...anonymousComment, children: nestedChildren('4'), id: '6' },
  { ...verifiedUserComment, children: nestedChildren('5'), id: '7' },
] as CommentListQuery['comments'];

export default {
  component: CommentListContainer,
  title: 'Container/Comment List',
} as Meta;

export const Default: StoryObj = {
  args: {
    id: '1234',
    type: CommentItemType.Article,
    onVariablesChange: action('onVariablesChange'),
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: CommentListDocument,
            variables: {
              itemId: '1234',
            },
          },
          result: {
            data: {
              comments,
              ratingSystem: {
                __typename: 'CommentRatingSystem',
                answers: [],
                id: '123',
                name: 'default',
              },
            },
          },
        },
        {
          request: {
            query: ChallengeDocument,
            variables: {},
          },
          result: {
            data: {
              challenge,
            },
          },
        },
        {
          request: {
            query: SettingListDocument,
            variables: {},
          },
          result: {
            data: {
              settings,
            },
          },
        },
      ],
    },
  },
};
