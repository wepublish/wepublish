import {css} from '@emotion/react'
import {Meta, StoryObj} from '@storybook/react'
import {WithUserDecorator} from '@wepublish/storybook'
import {CommentListQuery, CommentState, FullImageFragment} from '@wepublish/website/api'
import {Node} from 'slate'
import {Comment} from './comment'

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
  xl: 'https://unsplash.it/1200/400',
  l: 'https://unsplash.it/1000/400',
  m: 'https://unsplash.it/800/400',
  s: 'https://unsplash.it/500/300',
  xs: 'https://unsplash.it/300/200',
  xxs: 'https://unsplash.it/200/100',
  xlSquare: 'https://unsplash.it/1200/1200',
  lSquare: 'https://unsplash.it/1000/1000',
  mSquare: 'https://unsplash.it/800/800',
  sSquare: 'https://unsplash.it/500/500',
  xsSquare: 'https://unsplash.it/300/300',
  xxsSquare: 'https://unsplash.it/200/200'
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
  children: [],
  calculatedRatings: [],
  overriddenRatings: [],
  userRatings: []
} as CommentListQuery['comments'][number]

const verifiedUserComment = {
  id: 'verified',
  parentID: 'cljgx3n3i382572shctpgd5gg0',
  peerId: null,
  user: {
    __typename: 'User',
    id: 'qnK8vb5D5RtlTEbb',
    name: 'User',
    firstName: 'Fallback',
    email: 'foobar@example.com',
    address: null,
    flair: 'Flair',
    paymentProviderCustomers: [],
    image,
    properties: [],
    oauth2Accounts: []
  },
  guestUsername: null,
  guestUserImage: null,
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
  tags: [],
  userRatings: [],
  calculatedRatings: [],
  overriddenRatings: []
} as CommentListQuery['comments'][number]

export default {
  component: Comment,
  title: 'Components/Comment'
} as Meta

const Default: StoryObj = {
  args: {}
}

export const VerifiedUser: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    ...verifiedUserComment
  }
}

export const AnonymousUser: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    ...anonymousComment
  }
}

export const WithoutImage: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    ...verifiedUserComment,
    guestUserImage: null,
    user: {
      ...verifiedUserComment.user,
      image: null
    }
  }
}

export const WithoutFlair: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    ...verifiedUserComment,
    user: {
      ...verifiedUserComment.user,
      flair: null
    }
  }
}

export const WithoutSource: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    ...verifiedUserComment,
    source: null,
    user: {
      ...verifiedUserComment.user,
      flair: null
    }
  }
}

export const PendingApproval: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    ...verifiedUserComment,
    state: CommentState.PendingApproval
  }
}

export const PendingUserChanges: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    ...verifiedUserComment,
    state: CommentState.PendingUserChanges
  },
  decorators: [WithUserDecorator(verifiedUserComment.user ?? null)]
}

export const Rejected: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    ...verifiedUserComment,
    state: CommentState.Rejected,
    rejectionReason: 'Spam'
  }
}

export const WithClassName: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    ...verifiedUserComment,
    className: 'extra-classname'
  }
}

export const WithEmotion: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    ...verifiedUserComment,
    css: css`
      background-color: #eee;
    `
  }
}
