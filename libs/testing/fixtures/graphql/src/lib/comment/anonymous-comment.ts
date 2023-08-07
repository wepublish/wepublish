import {faker} from '@faker-js/faker'
import {image} from '../image/image'
import {text} from '../text/text'

export const anonymousComment = {
  __typename: 'Comment',
  id: 'anonymous',
  parentID: faker.string.uuid(),
  peerId: faker.string.uuid(),
  user: null,
  guestUsername: 'Dr. Anonymous',
  guestUserImage: image,
  calculatedRatings: [
    {
      count: 3,
      mean: 5,
      total: 15,
      answer: {
        id: faker.string.uuid(),
        answer: faker.lorem.words(1),
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
        id: faker.string.uuid(),
        answer: faker.lorem.words(1),
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
        id: faker.string.uuid(),
        answer: faker.lorem.words(1),
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
  itemID: faker.string.uuid(),
  itemType: 'Article',
  title: faker.lorem.words(3),
  lead: null,
  text,
  state: 'Approved',
  source: 'Source',
  rejectionReason: null,
  createdAt: faker.date.past().toISOString(),
  modifiedAt: faker.date.past().toISOString(),
  children: []
}
