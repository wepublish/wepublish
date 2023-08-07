import {ApolloError} from '@apollo/client'
import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'
import {useArgs, useReducer} from '@storybook/preview-api'
import {Meta, StoryObj} from '@storybook/react'
import {userEvent, waitFor, within} from '@storybook/testing-library'
import {SessionTokenContext} from '@wepublish/authentication/website'
import {CommentState} from '@wepublish/website/api'
import {ComponentProps, ComponentType} from 'react'
import {LoggedInFilled} from '../comment-editor/comment-editor.stories'
import {CommentListItem} from './comment-list-item'
import {commentListReducer} from './comment-list.state'
import {verifiedUserComment, anonymousComment, challenge} from '@wepublish/testing/fixtures/graphql'

// Custom render function as Storybook passes the children down as render props
// Also for passing down the reducer
function Render() {
  const [args] = useArgs()
  const [openCommentEditors, dispatch] = useReducer(commentListReducer, {})
  const props = args as ComponentProps<typeof CommentListItem>

  return (
    <CommentListItem
      {...props}
      openEditorsState={openCommentEditors}
      openEditorsStateDispatch={dispatch}
    />
  )
}

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

const openAddEditor: StoryObj['play'] = async ({canvasElement, step}) => {
  const canvas = within(canvasElement)
  const submitButton = canvas.getByText('Antworten')

  await step('Open comment editor', async () => {
    await userEvent.click(submitButton)
    await waitFor(() => canvas.getByLabelText('Titel'))
  })
}

const openEditEditor: StoryObj['play'] = async ({canvasElement, step}) => {
  const canvas = within(canvasElement)
  const submitButton = canvas.getByText('Editieren')

  await step('Open comment editor', async () => {
    await userEvent.click(submitButton)
  })

  await waitFor(() => canvas.getByLabelText('Titel'))
}

export default {
  component: CommentListItem,
  title: 'Components/Comment List/Item',
  render: Render
} as Meta

export const VerifiedUser: StoryObj = {
  args: {
    ...verifiedUserComment,
    challenge: {
      data: {challenge}
    },
    maxCommentLength: 2000
  }
}

export const AnonymousUser: StoryObj = {
  args: {
    ...anonymousComment,
    challenge: {
      data: {challenge}
    },
    maxCommentLength: 2000
  }
}

export const WithoutImage: StoryObj = {
  args: {
    ...verifiedUserComment,
    challenge: {
      data: {challenge}
    },
    maxCommentLength: 2000,
    guestUserImage: null,
    user: {
      ...verifiedUserComment.user,
      image: null
    }
  }
}

export const WithoutFlair: StoryObj = {
  args: {
    ...verifiedUserComment,
    challenge: {
      data: {challenge}
    },
    maxCommentLength: 2000,
    user: {
      ...verifiedUserComment.user,
      flair: null
    }
  }
}

export const WithoutSource: StoryObj = {
  args: {
    ...verifiedUserComment,
    challenge: {
      data: {challenge}
    },
    maxCommentLength: 2000,
    source: null,
    user: {
      ...verifiedUserComment.user,
      flair: null
    }
  }
}

export const WithoutPreferredName: StoryObj = {
  args: {
    ...verifiedUserComment,
    challenge: {
      data: {challenge}
    },
    maxCommentLength: 2000,
    user: {
      ...verifiedUserComment.user,
      preferredName: null
    }
  }
}

export const PendingApproval: StoryObj = {
  args: {
    ...verifiedUserComment,
    challenge: {
      data: {challenge}
    },
    maxCommentLength: 2000,
    state: CommentState.PendingApproval
  }
}

export const PendingUserChanges: StoryObj = {
  args: {
    ...verifiedUserComment,
    challenge: {
      data: {challenge}
    },
    maxCommentLength: 2000,
    state: CommentState.PendingUserChanges
  },
  decorators: [WithUserDecorator]
}

export const Rejected: StoryObj = {
  args: {
    ...verifiedUserComment,
    challenge: {
      data: {challenge}
    },
    maxCommentLength: 2000,
    state: CommentState.Rejected,
    rejectionReason: 'Spam'
  }
}

export const Nested: StoryObj = {
  args: {
    ...verifiedUserComment,
    challenge: {
      data: {challenge}
    },
    maxCommentLength: 2000,
    children: [
      {
        ...verifiedUserComment,
        challenge: {
          data: {challenge}
        },
        maxCommentLength: 2000,
        children: [verifiedUserComment]
      },
      {
        ...anonymousComment,
        maxCommentLength: 2000,
        children: [verifiedUserComment]
      }
    ]
  }
}

export const Commenting: StoryObj = {
  args: {
    ...verifiedUserComment,
    add: {},
    challenge: {
      data: {challenge}
    },
    maxCommentLength: 2000,
    onAddComment: action('onAddComment')
  },
  decorators: [WithUserDecorator]
}

export const AnonymousCommenting: StoryObj = {
  args: {
    ...verifiedUserComment,
    add: {},
    challenge: {
      data: {challenge}
    },
    maxCommentLength: 2000,
    anonymousCanComment: true,
    onAddComment: action('onAddComment')
  }
}

export const CommentingWithError: StoryObj = {
  ...Commenting,
  args: {
    ...Commenting.args,
    add: {
      error: new ApolloError({
        errorMessage: 'Something went wrong.'
      })
    }
  },
  play: async ctx => {
    await openAddEditor(ctx)
    await LoggedInFilled.play?.(ctx)
  }
}

export const Editing: StoryObj = {
  args: {
    ...verifiedUserComment,
    edit: {},
    challenge: {
      data: {challenge}
    },
    maxCommentLength: 2000,
    userCanEdit: true,
    onEditComment: action('onEditComment')
  },
  decorators: [WithUserDecorator]
}

export const EditingWithError: StoryObj = {
  ...Editing,
  args: {
    ...Editing.args,
    edit: {
      error: new ApolloError({
        errorMessage: 'Something went wrong.'
      })
    }
  },
  play: async ctx => {
    await openEditEditor(ctx)
    await LoggedInFilled.play?.(ctx)
  }
}

export const WithClassName: StoryObj = {
  args: {
    ...verifiedUserComment,
    challenge: {
      data: {challenge}
    },
    maxCommentLength: 2000,
    className: 'extra-classname'
  }
}

export const WithEmotion: StoryObj = {
  args: {
    ...verifiedUserComment,
    challenge: {
      data: {challenge}
    },
    maxCommentLength: 2000,
    css: css`
      background-color: #eee;
    `
  }
}
