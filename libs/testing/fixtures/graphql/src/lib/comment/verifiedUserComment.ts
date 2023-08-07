import {faker} from '@faker-js/faker'
import {
  CommentAuthorType,
  CommentItemType,
  CommentListQuery,
  CommentState
} from '@wepublish/website/api'
import {image} from '../image/image'
import {text} from '../text/text'

export const verifiedUserComment: CommentListQuery['comments'][number] = {
  id: 'verified',
  parentID: faker.string.uuid(),
  peerId: null,
  overriddenRatings: [],
  user: {
    __typename: 'User',
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    firstName: faker.person.firstName(),
    email: faker.internet.email(),
    preferredName: faker.person.fullName(),
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
