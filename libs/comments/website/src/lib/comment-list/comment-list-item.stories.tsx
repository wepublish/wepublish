import {css} from '@emotion/react'
import {Meta, StoryObj} from '@storybook/react'
import {CommentListQuery, CommentState, FullImageFragment} from '@wepublish/website/api'
import {CommentListItem} from './comment-list-item'
import {ComponentProps} from 'react'
import {useArgs} from '@storybook/preview-api'
import {Node} from 'slate'

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

const staffComment = {
  ...verifiedUserComment,
  id: 'staff',
  user: {
    ...verifiedUserComment.user,
    firstName: 'Staff',
    email: 'foobar@example.com',
    preferredName: 'Staff'
  },
  tags: [
    {
      id: 'cl9wv72ui1789854fs2uqjceto',
      tag: 'Moderation',
      type: 'Comment',
      __typename: 'Tag'
    }
  ],
  authorType: 'Team',
  children: []
} as CommentListQuery['comments'][number]

// Custom render function as Storybook passes the children down as render props
const Render = () => {
  const [args] = useArgs()
  const props = args as ComponentProps<typeof CommentListItem>

  return <CommentListItem {...props} />
}

export default {
  component: CommentListItem,
  title: 'Components/CommentList/Item',
  render: Render
} as Meta

export const VerifiedUser = {
  args: verifiedUserComment
}

export const AnonymousUser = {
  args: anonymousComment
}

export const StaffMember = {
  args: staffComment
}

export const WithoutImage = {
  args: {
    ...verifiedUserComment,
    guestUserImage: null,
    user: {
      ...verifiedUserComment.user,
      image: null
    }
  }
}

export const WithoutFlair = {
  args: {
    ...verifiedUserComment,
    user: {
      ...verifiedUserComment.user,
      flair: null
    }
  }
}

export const WithoutSource = {
  args: {
    ...verifiedUserComment,
    source: null,
    user: {
      ...verifiedUserComment.user,
      flair: null
    }
  }
}

export const WithoutPreferredName = {
  args: {
    ...verifiedUserComment,
    user: {
      ...verifiedUserComment.user,
      preferredName: null
    }
  }
}

export const PendingApproval: StoryObj<typeof CommentListItem> = {
  args: {
    ...verifiedUserComment,
    state: CommentState.PendingApproval
  }
}

export const PendingUserChanges: StoryObj<typeof CommentListItem> = {
  args: {
    ...verifiedUserComment,
    state: CommentState.PendingUserChanges
  }
}

export const Rejected: StoryObj<typeof CommentListItem> = {
  args: {
    ...verifiedUserComment,
    state: CommentState.Rejected,
    rejectionReason: 'Spam'
  }
}

export const Nested = {
  args: {
    ...verifiedUserComment,
    children: [
      {
        ...verifiedUserComment,
        children: [verifiedUserComment]
      },
      anonymousComment,
      {
        ...staffComment,
        children: [verifiedUserComment]
      }
    ]
  }
}

export const WithClassName = {
  args: {
    ...verifiedUserComment,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    ...verifiedUserComment,
    css: css`
      background-color: #eee;
    `
  }
}
