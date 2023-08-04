import {ApolloError} from '@apollo/client'
import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'
import {Meta, StoryObj} from '@storybook/react'
import {userEvent, waitFor, within} from '@storybook/testing-library'
import {SessionTokenContext} from '@wepublish/authentication/website'
import {ComponentProps, ComponentType, useReducer} from 'react'
import {CommentList} from './comment-list'
import {commentListReducer} from './comment-list.state'
import {verifiedUserComment, anonymousComment, challenge} from '@wepublish/testing/fixtures/graphql'

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

// Custom render function for passing down the reducer
function Render(props: ComponentProps<typeof CommentList>) {
  const [openCommentEditors, dispatch] = useReducer(commentListReducer, {})

  return (
    <CommentList
      {...props}
      openEditorsState={openCommentEditors}
      openEditorsStateDispatch={dispatch}
    />
  )
}

export default {
  component: Render,
  title: 'Components/Comment List'
} as Meta

export const Default: StoryObj = {
  args: {
    data: {
      comments: [
        verifiedUserComment,
        {...verifiedUserComment, children: nestedChildren('1'), id: '1'},
        {...anonymousComment, children: nestedChildren('2'), id: '2'},
        {...verifiedUserComment, id: '3'},
        {...anonymousComment, children: nestedChildren('4'), id: '4'},
        {...verifiedUserComment, children: nestedChildren('5'), id: '5'}
      ]
    },
    variables: {},
    onVariablesChange: action('onVariablesChange'),
    challenge: {
      data: {challenge}
    },
    maxCommentLength: 2000,
    add: {},
    edit: {}
  }
}

export const Empty: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    data: {
      comments: []
    }
  }
}

export const Commenting: StoryObj = {
  ...Default,
  decorators: [WithUserDecorator]
}

export const CommentingOpen: StoryObj = {
  ...Commenting,
  decorators: [WithUserDecorator],
  play: async ctx => {
    const {canvasElement, step} = ctx
    const canvas = within(canvasElement)
    const submitButton = canvas.getByText('Jetzt Mitreden')

    await step('Open comment editor', async () => {
      await userEvent.click(submitButton)
      await waitFor(() => canvas.getByLabelText('Titel'))
    })
  }
}

export const AnonymousCommenting: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    anonymousCanComment: true
  }
}

export const AnonymousCommentingOpen: StoryObj = {
  ...AnonymousCommenting,
  play: async ctx => {
    const {canvasElement, step} = ctx
    const canvas = within(canvasElement)
    const submitButton = canvas.getByText('Jetzt Mitreden')

    await step('Open comment editor', async () => {
      await userEvent.click(submitButton)
      await waitFor(() => canvas.getByLabelText('Titel'))
    })
  }
}

export const WithLoading: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    data: undefined,
    loading: true
  }
}

export const WithError: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    data: undefined,
    loading: false,
    error: new ApolloError({
      errorMessage: 'Foobar'
    })
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
