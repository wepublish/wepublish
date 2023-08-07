import {image} from '../image/image'
import {text} from '../text/text'

export const anonymousComment = {
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
