import {CommentListQuery} from '@wepublish/website/api'
import {image} from '../image/image'
import {text} from '../text/text'

export const verifiedUserComment: CommentListQuery['comments'][number] = {
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
}
