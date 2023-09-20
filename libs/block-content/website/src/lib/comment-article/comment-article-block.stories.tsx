import {ApolloError} from '@apollo/client'
import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'
import {Meta, StoryObj} from '@storybook/react'
import {userEvent, waitFor, within} from '@storybook/testing-library'
import {SessionTokenContext} from '@wepublish/authentication/website'
import {Challenge, CommentListQuery, FullImageFragment} from '@wepublish/website/api'
import {ComponentProps, ComponentType, useReducer} from 'react'
import {Node} from 'slate'
import {CommentArticleBlock} from './comment-article-block'
// import {commentListReducer} from './comment-list.state'

const image = {
  __typename: 'Image',
  id: 'ljh9FHAvHAs0AxC',
  mimeType: 'image/jpg',
  format: 'jpg',
  createdAt: '2023-04-18T12:38:56.369Z',
  modifiedAt: '2023-04-18T12:38:56.371Z',
  filename: 'DSC07717',
  extension: '.JPG',
  width: 4000,
  height: 6000,
  fileSize: 8667448,
  description: null,
  tags: [],
  source: null,
  link: null,
  license: null,
  focalPoint: {
    x: 0.5,
    y: 0.5
  },
  title: null,
  url: 'https://unsplash.it/500/281',
  bigURL: 'https://unsplash.it/800/400',
  largeURL: 'https://unsplash.it/500/300',
  mediumURL: 'https://unsplash.it/300/200',
  smallURL: 'https://unsplash.it/200/100',
  squareBigURL: 'https://unsplash.it/800/800',
  squareLargeURL: 'https://unsplash.it/500/500',
  squareMediumURL: 'https://unsplash.it/300/300',
  squareSmallURL: 'https://unsplash.it/200/200'
} as FullImageFragment

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

const anonymousComment = {
  __typename: 'Comment',
  id: 'anonymous',
  parentID: null,
  peerId: null,
  user: null,
  guestUsername: 'Dr. Anonymous',
  guestUserImage: image,
  calculatedRatings: [
    {
      count: 3,
      mean: 5,
      total: 15,
      answer: {
        id: 'cl9wv78am1810854fszdbjcu6f',
        answer: 'Informativ',
        ratingSystemId: 'default',
        type: 'STAR',
        __typename: 'CommentRatingSystemAnswer'
      },
      __typename: 'CalculatedRating'
    },
    {
      count: 2,
      mean: 5,
      total: 10,
      answer: {
        id: 'cl9wv7drp1822954fszyd05kqe',
        answer: 'Konstruktiv',
        ratingSystemId: 'default',
        type: 'STAR',
        __typename: 'CommentRatingSystemAnswer'
      },
      __typename: 'CalculatedRating'
    },
    {
      count: 3,
      mean: 5,
      total: 15,
      answer: {
        id: 'cl9wv7h961829254fsrm9mpjzz',
        answer: 'Nützlich',
        ratingSystemId: 'default',
        type: 'STAR',
        __typename: 'CommentRatingSystemAnswer'
      },
      __typename: 'CalculatedRating'
    }
  ],
  overriddenRatings: [],
  tags: [],
  authorType: 'GuestUser',
  itemID: 'cljfya8sj4342602siydzsx4pxv',
  itemType: 'Article',
  title: 'de Finibus Bonorum et Malorum',
  lead: null,
  text,
  state: 'Approved',
  source: 'Source',
  rejectionReason: null,
  createdAt: '2023-06-29T09:02:46.446Z',
  modifiedAt: '2023-06-29T09:02:46.446Z',
  children: []
}

const verifiedUserComment = {
  id: 'verified',
  parentID: 'cljgx3n3i382572shctpgd5gg0',
  peerId: null,
  overriddenRatings: [],
  user: {
    __typename: 'User',
    id: 'qnK8vb5D5RtlTEbb',
    name: 'User',
    firstName: 'Fallback',
    email: 'foobar@example.com',
    preferredName: 'Signed Up',
    address: null,
    flair: 'Flair',
    paymentProviderCustomers: [],
    image,
    properties: [],
    oauth2Accounts: []
  },
  guestUsername: null,
  guestUserImage: null,
  calculatedRatings: null,
  authorType: 'VerifiedUser',
  itemID: 'cljfya8sj4342602siydzsx4pxv',
  itemType: 'Article',
  title: 'de Finibus Bonorum et Malorum',
  lead: null,
  text,
  state: 'Approved',
  source: 'Source',
  rejectionReason: null,
  createdAt: '2023-06-29T09:39:28.351Z',
  modifiedAt: '2023-06-29T09:45:01.334Z',
  __typename: 'Comment',
  children: [],
  tags: []
} as CommentListQuery['comments'][number]

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
// function Render(props: ComponentProps<typeof CommentArticleBlock>) {
//   // const [openCommentEditors, dispatch] = useReducer(commentListReducer, {})

//   return (
//     <CommentList
//       {...props}
//       openEditorsState={openCommentEditors}
//       openEditorsStateDispatch={dispatch}
//     />
//   )
// }

export default {
  component: CommentArticleBlock,
  title: 'Blocks/CommentArticle'
} as Meta

export const Default: StoryObj = {
  args: {
    // data: {
    comments: [
      verifiedUserComment,
      {...verifiedUserComment, id: '123'}
      // {...verifiedUserComment, children: nestedChildren('1'), id: '1'},
      // {...anonymousComment, children: nestedChildren('2'), id: '2'},
      // {...verifiedUserComment, id: '3'},
      // {...anonymousComment, children: nestedChildren('4'), id: '4'},
      // {...verifiedUserComment, children: nestedChildren('5'), id: '5'}
    ]
    // },
    // variables: {},
    // onVariablesChange: action('onVariablesChange'),
    // challenge: {
    // data: {challenge}
    // },
    // maxCommentLength: 2000,
    // add: {},
    // edit: {}
  }
}

// export const Empty: StoryObj = {
//   ...Default,
//   args: {
//     ...Default.args,
//     data: {
//       comments: []
//     }
//   }
// }

// export const Commenting: StoryObj = {
//   ...Default,
//   decorators: [WithUserDecorator]
// }

// export const CommentingOpen: StoryObj = {
//   ...Commenting,
//   decorators: [WithUserDecorator],
//   play: async ctx => {
//     const {canvasElement, step} = ctx
//     const canvas = within(canvasElement)
//     const submitButton = canvas.getByText('Jetzt Mitreden')

//     await step('Open comment editor', async () => {
//       await userEvent.click(submitButton)
//       await waitFor(() => canvas.getByLabelText('Titel'))
//     })
//   }
// }

// export const AnonymousCommenting: StoryObj = {
//   ...Default,
//   args: {
//     ...Default.args,
//     anonymousCanComment: true
//   }
// }

// export const AnonymousCommentingOpen: StoryObj = {
//   ...AnonymousCommenting,
//   play: async ctx => {
//     const {canvasElement, step} = ctx
//     const canvas = within(canvasElement)
//     const submitButton = canvas.getByText('Jetzt Mitreden')

//     await step('Open comment editor', async () => {
//       await userEvent.click(submitButton)
//       await waitFor(() => canvas.getByLabelText('Titel'))
//     })
//   }
// }

// export const WithLoading: StoryObj = {
//   ...Default,
//   args: {
//     ...Default.args,
//     data: undefined,
//     loading: true
//   }
// }

// export const WithError: StoryObj = {
//   ...Default,
//   args: {
//     ...Default.args,
//     data: undefined,
//     loading: false,
//     error: new ApolloError({
//       errorMessage: 'Foobar'
//     })
//   }
// }

// export const WithClassName: StoryObj = {
//   ...Default,
//   args: {
//     ...Default.args,
//     className: 'extra-classname'
//   }
// }

// export const WithEmotion: StoryObj = {
//   ...Default,
//   args: {
//     ...Default.args,
//     css: css`
//       background-color: #eee;
//     `
//   }
// }
