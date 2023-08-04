import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'
import {Meta, StoryObj} from '@storybook/react'
import {SessionTokenContext} from '@wepublish/authentication/website'
import {
  ChallengeDocument,
  CommentItemType,
  CommentListDocument,
  CommentListQuery,
  SettingListDocument
} from '@wepublish/website/api'
import {ComponentType} from 'react'
import {CommentListContainer} from './comment-list-container'
import {verifiedUserComment, anonymousComment, challenge} from '@wepublish/testing/fixtures/graphql'

const settings = [
  {
    id: 'cliahqekg00289lpxqgpyump7',
    name: 'COMMENT_CHAR_LIMIT',
    value: 1000,
    __typename: 'Setting'
  },
  {
    id: 'cliahqekg00309lpxthdcxuqe',
    name: 'ALLOW_COMMENT_EDITING',
    value: true,
    __typename: 'Setting'
  },
  {
    id: 'cliahqekf00029lpx01s7tqqg',
    name: 'ALLOW_GUEST_COMMENTING',
    value: false,
    __typename: 'Setting'
  },
  {
    id: 'cliahqekf00069lpxr3sdhs25',
    name: 'ALLOW_GUEST_POLL_VOTING',
    value: false,
    __typename: 'Setting'
  },
  {
    id: 'cliahqekf00049lpx76jxhjqk',
    name: 'ALLOW_GUEST_COMMENT_RATING',
    value: false,
    __typename: 'Setting'
  }
]

const nestedChildren = (id: string) => [
  {
    ...verifiedUserComment,
    id: `${id}-1`,
    children: [{...verifiedUserComment, id: `${id}-1-1`}]
  },
  {
    ...anonymousComment,
    id: `${id}-2`,
    children: [{...verifiedUserComment, id: `${id}-2-1`}]
  }
]

const comments = [
  {...verifiedUserComment},
  {...verifiedUserComment, children: nestedChildren('1'), id: '1'},
  {...anonymousComment, children: nestedChildren('2'), id: '2'},
  {...verifiedUserComment, id: '3'},
  {...anonymousComment, children: nestedChildren('4'), id: '4'},
  {...verifiedUserComment, children: nestedChildren('5'), id: '5'}
] as CommentListQuery['comments']

const WithUserDecorator = (Story: ComponentType) => {
  return (
    <SessionTokenContext.Provider
      value={[
        verifiedUserComment.user ?? null,
        true,
        () => {
          /* do nothing */
        }
      ]}>
      <Story />
    </SessionTokenContext.Provider>
  )
}

export default {
  component: CommentListContainer,
  title: 'Container/Comment List'
} as Meta

export const Default: StoryObj = {
  args: {
    id: '1234',
    type: CommentItemType.Article,
    onChallengeQuery: action('onChallengeQuery'),
    onSettingListQuery: action('onSettingListQuery'),
    onCommentListQuery: action('onCommentListQuery'),
    onVariablesChange: action('onVariablesChange'),
    onAddComment: action('onAddComment'),
    onEditComment: action('onEditComment')
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: CommentListDocument,
            variables: {
              itemId: '1234'
            }
          },
          result: {
            data: {
              comments
            }
          }
        },
        {
          request: {
            query: ChallengeDocument,
            variables: {}
          },
          result: {
            data: {
              challenge
            }
          }
        },
        {
          request: {
            query: SettingListDocument,
            variables: {}
          },
          result: {
            data: {
              settings
            }
          }
        }
      ]
    }
  }
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
