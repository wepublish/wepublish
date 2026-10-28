import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockComment,
  mockCommentRating,
  mockCommentRatingAnswer,
  mockCommentRatingSystem,
  mockOperation,
  mockSensitiveDataUser,
  mockSetting,
  mockSettingListQuery,
  renderWithProviders,
  RenderWithProvidersOptions,
} from '@wepublish/mocks/website';
import { RateCommentDocument, SettingName } from '@wepublish/website/api';
import { CommentRatings } from './comment-ratings';
import { CommentRatingsProvider } from './comment-ratings.provider';

const commentId = 'comment-1';
const answer = mockCommentRatingAnswer({
  id: 'relevance',
  answer: 'Relevance',
});

const guestRating = (allowed: boolean) =>
  mockSettingListQuery([
    mockSetting({ name: SettingName.AllowGuestCommentRating, value: allowed }),
  ]);

const rateMutation = (value: number) =>
  mockOperation(RateCommentDocument, {
    variables: { commentId, answerId: answer.id, value },
    data: {
      __typename: 'Mutation',
      rateComment: mockComment({ id: commentId }),
    },
  });

const renderProvider = (options: RenderWithProvidersOptions) =>
  renderWithProviders(
    <CommentRatingsProvider>
      <CommentRatings
        commentId={commentId}
        ratingSystem={mockCommentRatingSystem({ answers: [answer] })}
        calculatedRatings={[mockCommentRating({ answer, mean: 3 })]}
        overriddenRatings={[]}
        userRatings={[]}
      />
    </CommentRatingsProvider>,
    options
  );

const chooseStars = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string
) => {
  act(() => screen.getByRole('radio', { name }).focus());
  await user.keyboard(' ');
};

describe('CommentRatingsProvider', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('keeps ratings read-only for guests when guest rating is not allowed', async () => {
    renderProvider({ mocks: [guestRating(false)] });

    expect(
      await screen.findByRole('img', { name: '3 Stars' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('lets guests rate when allowed and remembers their rating in this browser', async () => {
    const user = userEvent.setup();
    renderProvider({ mocks: [guestRating(true), rateMutation(5)] });

    await screen.findByRole('radio', { name: '3 Stars' });
    await chooseStars(user, '5 Stars');

    await waitFor(() =>
      expect(screen.getByRole('radio', { name: '5 Stars' })).toBeChecked()
    );
    expect(localStorage.getItem(`comment-rate:${commentId}:${answer.id}`)).toBe(
      '5'
    );
  });

  it('shows the rating a guest gave earlier in this browser', async () => {
    localStorage.setItem(`comment-rate:${commentId}:${answer.id}`, '1');
    renderProvider({ mocks: [guestRating(true)] });

    expect(await screen.findByRole('radio', { name: '1 Star' })).toBeChecked();
  });

  it('sends the rating of a logged in user without storing it in the browser', async () => {
    const user = userEvent.setup();
    const { client } = renderProvider({
      user: mockSensitiveDataUser(),
      mocks: [guestRating(false), rateMutation(4)],
    });

    await chooseStars(user, '4 Stars');

    await waitFor(() =>
      expect(
        (client.cache.extract() as Record<string, unknown>)[
          `Comment:${commentId}`
        ]
      ).toBeDefined()
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(localStorage.length).toBe(0);
  });

  it('shows why the rating failed', async () => {
    const user = userEvent.setup();
    renderProvider({
      user: mockSensitiveDataUser(),
      mocks: [
        guestRating(false),
        mockOperation(RateCommentDocument, {
          variables: { commentId, answerId: answer.id, value: 4 },
          errors: [{ message: 'Rating is closed.' }],
        }),
      ],
    });

    await chooseStars(user, '4 Stars');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Rating is closed.'
    );
  });
});
