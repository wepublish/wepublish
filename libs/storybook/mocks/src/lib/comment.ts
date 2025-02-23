import {
  CalculatedRating,
  CommentAuthorType,
  CommentItemType,
  CommentRating,
  CommentRatingSystemAnswer,
  CommentState,
  FullCommentFragment,
  OverriddenRating,
  RatingSystemType
} from '@wepublish/website/api'
import nanoid from 'nanoid'
import {mockTag} from './tag'
import {mockImage} from './image'
import {mockRichText} from './richtext'

export const mockCommentRatingAnswer = ({
  id = nanoid(),
  answer = 'Foobar'
}: Partial<CommentRatingSystemAnswer> = {}) =>
  ({
    __typename: 'CommentRatingSystemAnswer',
    id,
    ratingSystemId: nanoid(),
    type: RatingSystemType.Star,
    answer
  } as CommentRatingSystemAnswer)

export const mockCommentRating = ({answer = 'Foobar', count = 4, mean = 2.5, total = 10} = {}) =>
  ({
    __typename: 'CalculatedRating',
    answer: mockCommentRatingAnswer({answer}),
    count,
    mean,
    total
  } as CalculatedRating)

export const mockOverridenRating = ({
  answerId = nanoid(),
  value = 100
}: Partial<OverriddenRating> = {}) =>
  ({
    __typename: 'overriddenRating',
    answerId,
    value
  } as OverriddenRating)

export const mockUserCommentRating = ({
  answer = 'Foobar',
  id = nanoid(),
  value = 100
}: Partial<Pick<CommentRating, 'value'> & Pick<CommentRatingSystemAnswer, 'answer' | 'id'>> = {}) =>
  ({
    __typename: 'CommentRating',
    answer: mockCommentRatingAnswer({id, answer}),
    value,
    commentId: nanoid(),
    createdAt: new Date('2023-01-01').toISOString(),
    id: nanoid()
  } as CommentRating)

export const mockComment = ({
  id = nanoid(),
  authorType = CommentAuthorType.GuestUser,
  children = [],
  calculatedRatings = [mockCommentRating(), mockCommentRating({answer: 'Barfoo'})],
  overriddenRatings = [mockOverridenRating({answerId: calculatedRatings[0].answer.id})],
  userRatings = [mockUserCommentRating({answer: calculatedRatings[0].answer.answer})],
  tags = [mockTag()],
  state = CommentState.Approved,
  featured = false,
  guestUserImage = mockImage(),
  guestUsername = 'Barfoo',
  text = mockRichText(),
  source = 'Source',
  title = 'Foobar',
  lead,
  rejectionReason,
  user
}: Partial<FullCommentFragment> = {}) =>
  ({
    id,
    __typename: 'Comment',
    authorType,
    children,
    calculatedRatings,
    createdAt: new Date('2023-01-01').toISOString(),
    modifiedAt: new Date('2023-01-01').toISOString(),
    itemID: nanoid(),
    itemType: CommentItemType.Article,
    state,
    overriddenRatings,
    userRatings,
    tags,
    url: 'https://example.com',
    parentID: nanoid(),
    featured,
    guestUserImage,
    guestUsername,
    lead,
    text,
    title,
    source,
    rejectionReason,
    user
  } as FullCommentFragment)
