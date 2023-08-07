import {faker} from '@faker-js/faker'
import {
  CommentAuthorType,
  CommentItemType,
  CommentState,
  Exact,
  FullCommentFragment
} from '@wepublish/website/api'
import {user} from '../user/user'
import {text} from '../text/text'

export const verifiedUserComment: Exact<FullCommentFragment> = {
  id: 'verified',
  parentID: faker.string.uuid(),
  peerId: null,
  overriddenRatings: [],
  user,
  guestUsername: null,
  guestUserImage: null,
  calculatedRatings: null,
  authorType: CommentAuthorType.VerifiedUser,
  itemID: faker.string.uuid(),
  itemType: CommentItemType.Article,
  title: faker.lorem.words(3),
  lead: null,
  text,
  state: CommentState.Approved,
  source: 'Source',
  rejectionReason: null,
  createdAt: faker.date.past().toISOString(),
  modifiedAt: faker.date.past().toISOString(),
  __typename: 'Comment',
  children: [],
  tags: []
}
