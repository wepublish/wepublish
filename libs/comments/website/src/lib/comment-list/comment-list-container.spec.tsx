import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockChallenge,
  mockChallengeToken,
  mockComment,
  mockCommentRatingSystem,
  mockOperation,
  mockRichTextParagraph,
  mockSensitiveDataUser,
  mockSetting,
  mockSettingListQuery,
  mockUser,
  renderWithProviders,
  RenderWithProvidersOptions,
  TEST_CAPTCHA_LABEL,
} from '@wepublish/mocks/website';
import {
  AddCommentDocument,
  ChallengeDocument,
  CommentAuthorType,
  CommentItemType,
  CommentListDocument,
  CommentListQueryVariables,
  EditCommentDocument,
  SettingName,
  SortOrder,
  CommentSort,
} from '@wepublish/website/api';
import { RichtextJSONDocument } from '@wepublish/richtext';
import { t } from 'i18next';
import { ComponentProps } from 'react';
import { CommentListContainer } from './comment-list-container';

type User = ReturnType<typeof userEvent.setup>;

const itemId = 'article-1';
const me = mockSensitiveDataUser({ id: 'me' });

const comment = (
  id: string,
  overrides: Parameters<typeof mockComment>[0] = {}
) =>
  mockComment({
    id,
    itemID: itemId,
    title: `Comment ${id}`,
    user: null,
    ...overrides,
  });

const myComment = comment('mine', {
  user: mockUser({ id: me.id }),
  authorType: CommentAuthorType.VerifiedUser,
  guestUsername: null,
  guestUserImage: null,
  text: mockRichTextParagraph('Original text'),
});

const commentsForItem = [
  comment('1', { children: [comment('1-1')] }),
  myComment,
];

const commentListQuery = (variables: CommentListQueryVariables = { itemId }) =>
  mockOperation(CommentListDocument, {
    variables,
    data: {
      __typename: 'Query',
      commentsForItem,
      ratingSystem: mockCommentRatingSystem(),
    },
  });

const settings = ({
  charLimit = 1000,
  guestCommenting = false,
  editing = false,
}: {
  charLimit?: number;
  guestCommenting?: boolean;
  editing?: boolean;
} = {}) =>
  mockSettingListQuery([
    mockSetting({ name: SettingName.CommentCharLimit, value: charLimit }),
    mockSetting({ name: SettingName.AllowCommentEditing, value: editing }),
    mockSetting({
      name: SettingName.AllowGuestCommenting,
      value: guestCommenting,
    }),
    mockSetting({ name: SettingName.AllowGuestCommentRating, value: false }),
  ]);

const challengeQuery = (challengeID: string) =>
  mockOperation(ChallengeDocument, {
    data: {
      __typename: 'Query',
      challenge: mockChallenge({ challengeID }),
    },
  });

const richText = (text: string) =>
  ({
    type: 'doc',
    attrs: undefined,
    content: [
      {
        type: 'paragraph',
        attrs: {},
        content: [{ type: 'text', text, attrs: undefined }],
      },
    ],
  }) as RichtextJSONDocument;

const renderContainer = (
  options: RenderWithProvidersOptions,
  variables?: ComponentProps<typeof CommentListContainer>['variables']
) =>
  renderWithProviders(
    <CommentListContainer
      id={itemId}
      type={CommentItemType.Article}
      variables={variables}
      onVariablesChange={vi.fn()}
    />,
    options
  );

const submitComment = async (user: User, title: string, text: string) => {
  await user.type(
    await screen.findByLabelText(t('commentEditor.title')),
    title
  );
  await user.type(screen.getByLabelText(t('commentEditor.text')), text);
  await user.click(
    screen.getByRole('button', { name: t('commentEditor.comment') })
  );
};

describe('CommentListContainer', () => {
  it('loads and shows the comments of the item', async () => {
    renderContainer({
      user: me,
      mocks: [commentListQuery(), settings()],
    });

    for (const id of ['1', '1-1', 'mine']) {
      expect(
        await screen.findByRole('heading', { name: `Comment ${id}` })
      ).toBeInTheDocument();
    }
  });

  it('passes sorting variables on to the query', async () => {
    renderContainer(
      {
        user: me,
        mocks: [
          commentListQuery({
            itemId,
            sort: CommentSort.Rating,
            order: SortOrder.Descending,
          }),
          settings(),
        ],
      },
      { sort: CommentSort.Rating, order: SortOrder.Descending }
    );

    expect(
      await screen.findByRole('heading', { name: 'Comment 1' })
    ).toBeInTheDocument();
  });

  it('shows why the comments could not be loaded', async () => {
    renderContainer({
      user: me,
      mocks: [
        mockOperation(CommentListDocument, {
          variables: { itemId },
          errors: [{ message: 'Comments are down.' }],
        }),
        settings(),
      ],
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Comments are down.'
    );
  });

  it('adds a new comment of a logged in user to the top of the list', async () => {
    const user = userEvent.setup();
    renderContainer({
      user: me,
      mocks: [
        commentListQuery(),
        settings(),
        mockOperation(AddCommentDocument, {
          variables: {
            itemID: itemId,
            title: 'Hello',
            text: richText('World'),
          },
          data: {
            __typename: 'Mutation',
            addUserComment: comment('new', { title: 'Hello' }),
          },
        }),
      ],
    });

    await user.click(
      await screen.findByRole('button', { name: t('comments.list.readMore') })
    );
    await submitComment(user, 'Hello', 'World');

    expect(
      await screen.findByRole('heading', { name: 'Hello' })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('article')[0]).toHaveTextContent('Hello');
    expect(
      screen.queryByLabelText(t('commentEditor.title'))
    ).not.toBeInTheDocument();
  });

  it('adds a reply below its parent comment', async () => {
    const user = userEvent.setup();
    renderContainer({
      user: me,
      mocks: [
        commentListQuery(),
        settings(),
        mockOperation(AddCommentDocument, {
          variables: {
            itemID: itemId,
            parentID: '1-1',
            title: 'Re',
            text: richText('Agreed'),
          },
          data: {
            __typename: 'Mutation',
            addUserComment: comment('reply', { parentID: '1-1', title: 'Re' }),
          },
        }),
      ],
    });

    const parent = (
      await screen.findByRole('heading', { name: 'Comment 1-1' })
    ).closest('article') as HTMLElement;
    await user.click(
      within(parent).getByRole('button', { name: t('comments.list.reply') })
    );
    await submitComment(user, 'Re', 'Agreed');

    await waitFor(() =>
      expect(
        within(parent).getByRole('heading', { name: 'Re' })
      ).toBeInTheDocument()
    );
  });

  it('lets the author edit a comment when editing is allowed', async () => {
    const user = userEvent.setup();
    renderContainer({
      user: me,
      mocks: [
        commentListQuery(),
        settings({ editing: true }),
        mockOperation(EditCommentDocument, {
          variables: {
            id: 'mine',
            title: 'Comment mine, edited',
            text: richText('Original text'),
          },
          data: {
            __typename: 'Mutation',
            updateUserComment: {
              ...myComment,
              title: 'Comment mine, edited',
            },
          },
        }),
      ],
    });

    await user.click(
      await screen.findByRole('button', { name: t('comments.list.edit') })
    );
    await user.type(
      screen.getByLabelText(t('commentEditor.title')),
      ', edited'
    );
    await user.click(
      screen.getByRole('button', { name: t('commentEditor.comment') })
    );

    expect(
      await screen.findByRole('heading', { name: 'Comment mine, edited' })
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(t('commentEditor.title'))
    ).not.toBeInTheDocument();
  });

  it('does not offer editing when it is turned off', async () => {
    renderContainer({
      user: me,
      mocks: [commentListQuery(), settings({ editing: false })],
    });

    await screen.findByRole('heading', { name: 'Comment mine' });

    expect(
      screen.queryByRole('button', { name: t('comments.list.edit') })
    ).not.toBeInTheDocument();
  });

  it('limits the comment length to the configured character limit', async () => {
    const user = userEvent.setup();
    renderContainer({
      user: me,
      mocks: [commentListQuery(), settings({ charLimit: 5 })],
    });

    await user.click(
      await screen.findByRole('button', { name: t('comments.list.readMore') })
    );
    await user.type(
      await screen.findByLabelText(t('commentEditor.text')),
      'abc'
    );

    expect(
      screen.getByText(t('commentEditor.characterCount', { length: 3, max: 5 }))
    ).toBeInTheDocument();
  });

  it('only offers guests to log in when guest commenting is turned off', async () => {
    const user = userEvent.setup();
    renderContainer({
      mocks: [
        commentListQuery(),
        settings({ guestCommenting: false }),
        challengeQuery('first'),
      ],
    });

    await user.click(
      await screen.findByRole('button', { name: t('comments.list.readMore') })
    );

    expect(
      await screen.findByRole('heading', {
        name: t('commentEditor.loginForReaders'),
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: t('commentEditor.guestComment') })
    ).not.toBeInTheDocument();
  });

  it('shows why a guest comment failed and succeeds on retry', async () => {
    const user = userEvent.setup();
    const guestVariables = {
      itemID: itemId,
      guestUsername: 'Guest',
      title: 'Hello',
      text: richText('World'),
      challenge: {
        challengeID: 'site-key',
        challengeSolution: mockChallengeToken,
      },
    };

    renderContainer({
      mocks: [
        commentListQuery(),
        settings({ guestCommenting: true }),
        challengeQuery('site-key'),
        mockOperation(AddCommentDocument, {
          variables: guestVariables,
          errors: [{ message: 'Challenge failed.' }],
        }),
        challengeQuery('site-key'),
        mockOperation(AddCommentDocument, {
          variables: guestVariables,
          data: {
            __typename: 'Mutation',
            addUserComment: comment('guest', { title: 'Hello' }),
          },
        }),
        challengeQuery('site-key'),
      ],
    });

    await user.click(
      await screen.findByRole('button', { name: t('comments.list.readMore') })
    );
    await user.click(
      await screen.findByRole('button', {
        name: t('commentEditor.guestComment'),
      })
    );
    await user.type(screen.getByLabelText(t('commentEditor.name')), 'Guest');
    await screen.findByRole('group', { name: TEST_CAPTCHA_LABEL });
    await submitComment(user, 'Hello', 'World');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Challenge failed.'
    );

    await user.click(
      screen.getByRole('button', { name: t('commentEditor.comment') })
    );

    expect(
      await screen.findByRole('heading', { name: 'Hello' })
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(t('commentEditor.name'))
    ).not.toBeInTheDocument();
  });
});
