import {
  CalculatedRating,
  Comment,
  CommentAuthorType,
  CommentItemType,
  CommentRating,
  CommentRatingSystemAnswer,
  CommentState,
  OverriddenRating,
  RatingSystemType,
} from '@wepublish/website/api';
import { mockTag } from './tag';
import { mockImage } from './image';
import { mockRichText } from './richtext';
import { faker } from '@faker-js/faker';
import { mockUser } from './user';

export const mockCommentRatingAnswer = ({
  id = faker.string.nanoid(),
  answer = 'Foobar',
}: Partial<CommentRatingSystemAnswer> = {}) =>
  ({
    __typename: 'CommentRatingSystemAnswer',
    id,
    ratingSystemId: faker.string.nanoid(),
    type: RatingSystemType.Star,
    answer,
  }) as CommentRatingSystemAnswer;

export const mockCommentRating = ({
  answer = 'Foobar',
  count = 4,
  mean = 2.5,
  total = 10,
} = {}) =>
  ({
    __typename: 'CalculatedRating',
    answer: mockCommentRatingAnswer({ answer }),
    count,
    mean,
    total,
  }) as CalculatedRating;

export const mockOverridenRating = ({
  answerId = faker.string.nanoid(),
  value = 100,
}: Partial<OverriddenRating> = {}) =>
  ({
    __typename: 'OverriddenRating',
    answerId,
    value,
  }) as OverriddenRating;

export const mockUserCommentRating = ({
  answer = 'Foobar',
  id = faker.string.nanoid(),
  value = 100,
  disabled = false,
  userId = faker.string.nanoid(),
}: Partial<
  Pick<CommentRating, 'value' | 'disabled' | 'userId'> &
    Pick<CommentRatingSystemAnswer, 'answer' | 'id'>
> = {}) =>
  ({
    __typename: 'CommentRating',
    answer: mockCommentRatingAnswer({ id, answer }),
    value,
    commentId: faker.string.nanoid(),
    createdAt: new Date('2023-01-01').toISOString(),
    id: faker.string.nanoid(),
    disabled,
    userId,
  }) as CommentRating;

export const mockComment = ({
  id = faker.string.nanoid(),
  authorType = CommentAuthorType.GuestUser,
  children = [],
  calculatedRatings = [
    mockCommentRating(),
    mockCommentRating({ answer: 'Barfoo' }),
  ],
  overriddenRatings = [
    mockOverridenRating({ answerId: calculatedRatings[0].answer.id }),
  ],
  userRatings = [
    mockUserCommentRating({ answer: calculatedRatings[0].answer.answer }),
  ],
  tags = [mockTag()],
  state = CommentState.Approved,
  featured = false,
  guestUserImage = mockImage(),
  guestUsername = 'Barfoo',
  text = mockRichText(),
  source = 'Source',
  title = 'Foobar',
  lead = faker.lorem.sentence(),
  rejectionReason = faker.lorem.sentence(),
  user = mockUser(),
}: Partial<Comment> = {}): Comment => ({
  id,
  __typename: 'Comment',
  authorType,
  children,
  calculatedRatings,
  createdAt: new Date('2023-01-01').toISOString(),
  modifiedAt: new Date('2023-01-01').toISOString(),
  itemID: faker.string.nanoid(),
  itemType: CommentItemType.Article,
  state,
  overriddenRatings,
  userRatings,
  tags,
  url: 'https://example.com',
  parentID: faker.string.nanoid(),
  featured,
  guestUserImage,
  guestUsername,
  lead,
  text,
  title,
  source,
  rejectionReason,
  user,
});
