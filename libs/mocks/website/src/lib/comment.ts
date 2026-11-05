import {
  CommentAuthorType,
  CommentItemType,
  CommentState,
  FullCalculatedRatingFragment,
  FullCommentFragment,
  FullCommentRatingFragment,
  FullCommentRatingSystemAnswerFragment,
  FullOverriddenRatingFragment,
  FullRatingSystemFragment,
  RatingSystemType,
} from '@wepublish/website/api';
import { mockTag } from './tag';
import { mockImage } from './image';
import { mockRichText } from './richtext';
import { mockUser } from './user';
import { faker, MOCK_REFERENCE_DATE } from './faker';
import { definedOnly } from './overrides';

export const mockCommentRatingAnswer = (
  overrides: Partial<FullCommentRatingSystemAnswerFragment> = {}
): FullCommentRatingSystemAnswerFragment => ({
  __typename: 'CommentRatingSystemAnswer',
  id: faker.string.nanoid(),
  ratingSystemId: faker.string.nanoid(),
  type: RatingSystemType.Star,
  answer: 'Foobar',
  ...definedOnly(overrides),
});

export const mockCommentRatingSystem = ({
  id = faker.string.nanoid(),
  answers = [
    mockCommentRatingAnswer({ ratingSystemId: id, answer: 'Foobar' }),
    mockCommentRatingAnswer({ ratingSystemId: id, answer: 'Barfoo' }),
  ],
  ...overrides
}: Partial<FullRatingSystemFragment> = {}): FullRatingSystemFragment => ({
  __typename: 'CommentRatingSystem',
  id,
  name: 'default',
  answers,
  ...definedOnly(overrides),
});

export const mockCommentRating = ({
  answer = mockCommentRatingAnswer(),
  ...overrides
}: Partial<FullCalculatedRatingFragment> = {}): FullCalculatedRatingFragment => ({
  __typename: 'CalculatedRating',
  answer,
  count: 4,
  mean: 2.5,
  total: 10,
  ...definedOnly(overrides),
});

export const mockOverridenRating = (
  overrides: Partial<FullOverriddenRatingFragment> = {}
): FullOverriddenRatingFragment => ({
  __typename: 'OverriddenRating',
  answerId: faker.string.nanoid(),
  value: 100,
  ...definedOnly(overrides),
});

export const mockOverriddenRating = mockOverridenRating;

export const mockUserCommentRating = ({
  answer = mockCommentRatingAnswer(),
  ...overrides
}: Partial<FullCommentRatingFragment> = {}): FullCommentRatingFragment => ({
  __typename: 'CommentRating',
  id: faker.string.nanoid(),
  commentId: faker.string.nanoid(),
  userId: faker.string.nanoid(),
  value: 100,
  disabled: false,
  answer,
  ...definedOnly(overrides),
});

export const mockComment = ({
  children = [],
  calculatedRatings = [
    mockCommentRating(),
    mockCommentRating({
      answer: mockCommentRatingAnswer({ answer: 'Barfoo' }),
    }),
  ],
  overriddenRatings = [
    mockOverridenRating({ answerId: calculatedRatings[0].answer.id }),
  ],
  userRatings = [
    mockUserCommentRating({ answer: calculatedRatings[0].answer }),
  ],
  tags = [mockTag()],
  guestUserImage = mockImage(),
  text = mockRichText(),
  user = mockUser(),
  ...overrides
}: Partial<FullCommentFragment> = {}): FullCommentFragment => ({
  __typename: 'Comment',
  id: faker.string.nanoid(),
  itemID: faker.string.nanoid(),
  itemType: CommentItemType.Article,
  parentID: null,
  createdAt: MOCK_REFERENCE_DATE,
  modifiedAt: MOCK_REFERENCE_DATE,
  authorType: CommentAuthorType.GuestUser,
  state: CommentState.Approved,
  url: 'https://example.com',
  featured: false,
  guestUsername: 'Barfoo',
  title: 'Foobar',
  lead: faker.lorem.sentence(),
  source: 'Source',
  rejectionReason: null,
  children,
  calculatedRatings,
  overriddenRatings,
  userRatings,
  tags,
  guestUserImage,
  text,
  user,
  ...definedOnly(overrides),
});
