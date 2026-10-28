import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockCommentRating,
  mockCommentRatingAnswer,
  mockCommentRatingSystem,
  mockOverridenRating,
  mockSensitiveDataUser,
  mockUserCommentRating,
  createCommentRatingContext,
  renderWithProviders,
  RenderWithProvidersOptions,
} from '@wepublish/mocks/website';
import { BuilderCommentRatingsProps } from '@wepublish/website/builder';
import { CommentRatings } from './comment-ratings';

const commentId = 'comment-1';

const relevance = mockCommentRatingAnswer({
  id: 'relevance',
  answer: 'Relevance',
});
const tone = mockCommentRatingAnswer({ id: 'tone', answer: 'Tone' });

const props: BuilderCommentRatingsProps = {
  commentId,
  ratingSystem: mockCommentRatingSystem({ answers: [relevance, tone] }),
  calculatedRatings: [
    mockCommentRating({ answer: relevance, mean: 4 }),
    mockCommentRating({ answer: tone, mean: 2 }),
  ],
  overriddenRatings: [],
  userRatings: [],
};

const singleAnswerProps: BuilderCommentRatingsProps = {
  ...props,
  ratingSystem: mockCommentRatingSystem({ answers: [relevance] }),
  calculatedRatings: [mockCommentRating({ answer: relevance, mean: 3 })],
};

const chooseStars = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string
) => {
  act(() => screen.getByRole('radio', { name }).focus());
  await user.keyboard(' ');
};

const renderRatings = (
  overrides: Partial<BuilderCommentRatingsProps> = {},
  options: RenderWithProvidersOptions = {}
) =>
  renderWithProviders(
    <CommentRatings
      {...props}
      {...overrides}
    />,
    options
  );

describe('CommentRatings', () => {
  it('shows the calculated ratings read-only to guests who cannot rate', () => {
    renderRatings({}, { commentRating: createCommentRatingContext() });

    expect(screen.getByText('Relevance')).toBeInTheDocument();
    expect(screen.getByText('Tone')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '4 Stars' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '2 Stars' })).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('hides the answer name when the rating system has a single answer', () => {
    renderRatings(singleAnswerProps, {
      commentRating: createCommentRatingContext(),
    });

    expect(screen.queryByText('Relevance')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: '3 Stars' })).toBeInTheDocument();
  });

  it('shows nothing when the rating system has no answers', () => {
    renderRatings(
      { ratingSystem: mockCommentRatingSystem({ answers: [] }) },
      { commentRating: createCommentRatingContext() }
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('prefers an overridden rating over the calculated one', () => {
    renderRatings(
      {
        overriddenRatings: [
          mockOverridenRating({ answerId: relevance.id, value: 1 }),
        ],
      },
      { commentRating: createCommentRatingContext() }
    );

    expect(screen.getByRole('img', { name: '1 Star' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '2 Stars' })).toBeInTheDocument();
  });

  it('prefers the rating of the logged in user over everything else', () => {
    renderRatings(
      {
        ...singleAnswerProps,
        overriddenRatings: [
          mockOverridenRating({ answerId: relevance.id, value: 1 }),
        ],
        userRatings: [
          mockUserCommentRating({ commentId, answer: relevance, value: 5 }),
        ],
      },
      {
        user: mockSensitiveDataUser(),
        commentRating: createCommentRatingContext(),
      }
    );

    expect(screen.getByRole('radio', { name: '5 Stars' })).toBeChecked();
  });

  it('rates the comment as the logged in user', async () => {
    const user = userEvent.setup();
    const commentRating = createCommentRatingContext();
    renderRatings(singleAnswerProps, {
      user: mockSensitiveDataUser(),
      commentRating,
    });

    await chooseStars(user, '5 Stars');

    expect(commentRating.rate).toHaveBeenCalledWith({
      variables: { commentId, answerId: relevance.id, value: 5 },
    });
  });

  it('shows why rating failed', async () => {
    const user = userEvent.setup();
    const commentRating = createCommentRatingContext();
    commentRating.rate.mockRejectedValue(new Error('Something went wrong.'));
    renderRatings(singleAnswerProps, {
      user: mockSensitiveDataUser(),
      commentRating,
    });

    await chooseStars(user, '5 Stars');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong.'
    );
  });

  it('lets guests rate and shows their earlier rating when guest rating is allowed', async () => {
    const user = userEvent.setup();
    const commentRating = createCommentRatingContext({
      canRateAnonymously: true,
      anonymousRate: 2,
    });
    renderRatings(singleAnswerProps, { commentRating });

    expect(screen.getByRole('radio', { name: '2 Stars' })).toBeChecked();
    expect(commentRating.getAnonymousRate).toHaveBeenCalledWith(
      commentId,
      relevance.id
    );

    await chooseStars(user, '4 Stars');

    expect(commentRating.rate).toHaveBeenCalledWith({
      variables: { commentId, answerId: relevance.id, value: 4 },
    });
  });

  it('ignores ratings stored for logged in users when a guest views the comment', () => {
    renderRatings(
      {
        ...singleAnswerProps,
        userRatings: [
          mockUserCommentRating({ commentId, answer: relevance, value: 5 }),
        ],
      },
      {
        commentRating: createCommentRatingContext({ canRateAnonymously: true }),
      }
    );

    expect(screen.getByRole('radio', { name: '3 Stars' })).toBeChecked();
  });

  it('fails loudly when the rating context is missing the rate function', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() =>
      renderRatings(singleAnswerProps, {
        user: mockSensitiveDataUser(),
        commentRating: {},
      })
    ).toThrow('CommentRatingContext has not been fully provided.');
  });
});
