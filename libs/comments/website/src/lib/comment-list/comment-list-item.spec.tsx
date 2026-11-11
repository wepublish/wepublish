import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockChallenge,
  mockComment,
  mockCommentRating,
  mockCommentRatingAnswer,
  mockCommentRatingSystem,
  mockMutationResult,
  mockRichTextParagraph,
  mockSensitiveDataUser,
  mockUser,
  createCommentRatingContext,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  AddCommentMutation,
  CommentAuthorType,
  CommentState,
  EditCommentMutation,
} from '@wepublish/website/api';
import { BuilderCommentListItemProps } from '@wepublish/website/builder';
import { t } from 'i18next';
import { useReducer } from 'react';
import { CommentListItem } from './comment-list-item';
import { commentListReducer } from './comment-list.state';

type User = ReturnType<typeof userEvent.setup>;

const me = mockSensitiveDataUser({
  id: 'me',
  firstName: 'Anna',
  name: 'Muster',
});

const relevance = mockCommentRatingAnswer({
  id: 'relevance',
  answer: 'Relevance',
});
const tone = mockCommentRatingAnswer({ id: 'tone', answer: 'Tone' });

const ratings = {
  calculatedRatings: [
    mockCommentRating({ answer: relevance }),
    mockCommentRating({ answer: tone }),
  ],
  overriddenRatings: [],
  userRatings: [],
};

const myComment = mockComment({
  id: 'mine',
  title: 'My comment',
  text: mockRichTextParagraph('My text'),
  user: mockUser({ id: me.id, firstName: 'Anna', name: 'Muster' }),
  authorType: CommentAuthorType.VerifiedUser,
  guestUsername: null,
  guestUserImage: null,
  ...ratings,
});

const guestComment = (id: string, children = [] as (typeof myComment)[]) =>
  mockComment({
    id,
    title: `Comment ${id}`,
    user: null,
    children,
    ...ratings,
  });

const commentText = (text: string) => ({
  type: 'doc',
  attrs: undefined,
  content: [
    {
      type: 'paragraph',
      attrs: {},
      content: [{ type: 'text', text, attrs: undefined }],
    },
  ],
});

type ItemProps = Omit<
  BuilderCommentListItemProps,
  'openEditorsStateDispatch' | 'onAddComment' | 'onEditComment'
>;

const Harness = (
  props: ItemProps &
    Pick<BuilderCommentListItemProps, 'onAddComment' | 'onEditComment'>
) => {
  const [openEditorsState, dispatch] = useReducer(
    commentListReducer,
    props.openEditorsState
  );

  return (
    <CommentListItem
      {...props}
      openEditorsState={openEditorsState}
      openEditorsStateDispatch={dispatch}
    />
  );
};

const renderItem = (
  props: Partial<ItemProps> = {},
  { loggedIn = true }: { loggedIn?: boolean } = {}
) => {
  const onAddComment = vi.fn<BuilderCommentListItemProps['onAddComment']>();
  const onEditComment = vi.fn<BuilderCommentListItemProps['onEditComment']>();

  renderWithProviders(
    <Harness
      {...myComment}
      ratingSystem={mockCommentRatingSystem({ answers: [relevance, tone] })}
      challenge={{
        data: { __typename: 'Query', challenge: mockChallenge() },
        loading: false,
        error: undefined,
      }}
      maxCommentLength={2000}
      add={mockMutationResult<AddCommentMutation>()}
      edit={mockMutationResult<EditCommentMutation>()}
      openEditorsState={{}}
      signUpUrl="/signup"
      onAddComment={onAddComment}
      onEditComment={onEditComment}
      {...props}
    />,
    {
      user: loggedIn ? me : null,
      commentRating: createCommentRatingContext(),
    }
  );

  return { onAddComment, onEditComment };
};

const writeComment = async (user: User, title: string, text: string) => {
  const titleField = await screen.findByLabelText(t('commentEditor.title'));
  await user.clear(titleField);
  await user.type(titleField, title);

  const textField = screen.getByLabelText(t('commentEditor.text'));
  await user.clear(textField);
  await user.type(textField, text);

  await user.click(
    screen.getByRole('button', { name: t('commentEditor.comment') })
  );
};

describe('CommentListItem', () => {
  it('shows the comment with its rating answers', () => {
    renderItem();

    expect(
      screen.getByRole('heading', { name: 'My comment' })
    ).toBeInTheDocument();
    expect(screen.getByText('Relevance')).toBeInTheDocument();
    expect(screen.getByText('Tone')).toBeInTheDocument();
  });

  it('replies to the comment', async () => {
    const user = userEvent.setup();
    const { onAddComment } = renderItem();

    await user.click(
      screen.getByRole('button', { name: t('comments.list.reply') })
    );
    await writeComment(user, 'Re', 'Lorem Ipsum');

    await waitFor(() =>
      expect(onAddComment).toHaveBeenCalledWith({
        parentID: 'mine',
        title: 'Re',
        text: commentText('Lorem Ipsum'),
      })
    );
  });

  it('closes the reply editor on cancel', async () => {
    const user = userEvent.setup();
    renderItem();

    await user.click(
      screen.getByRole('button', { name: t('comments.list.reply') })
    );
    await user.click(
      await screen.findByRole('button', { name: t('commentEditor.cancel') })
    );

    expect(
      screen.queryByLabelText(t('commentEditor.title'))
    ).not.toBeInTheDocument();
  });

  it('offers guests to reply without an account when guests may comment', async () => {
    const user = userEvent.setup();
    renderItem({ anonymousCanComment: true }, { loggedIn: false });

    await user.click(
      screen.getByRole('button', { name: t('comments.list.reply') })
    );
    await user.click(
      await screen.findByRole('button', {
        name: t('commentEditor.guestComment'),
      })
    );

    expect(
      await screen.findByLabelText(t('commentEditor.name'))
    ).toBeInTheDocument();
  });

  it('shows why replying failed in the open reply editor', () => {
    renderItem({
      openEditorsState: { 'add:mine': true },
      add: mockMutationResult<AddCommentMutation>({
        called: true,
        error: new Error('Replying failed.'),
      }),
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Replying failed.');
  });

  it('edits the own comment in place', async () => {
    const user = userEvent.setup();
    const { onEditComment } = renderItem({ userCanEdit: true });

    await user.click(
      screen.getByRole('button', { name: t('comments.list.edit') })
    );

    expect(screen.getByLabelText(t('commentEditor.title'))).toHaveValue(
      'My comment'
    );
    expect(
      screen.queryByRole('heading', { name: 'My comment' })
    ).not.toBeInTheDocument();

    await writeComment(user, 'Edited', 'New text');

    await waitFor(() =>
      expect(onEditComment).toHaveBeenCalledWith({
        id: 'mine',
        title: 'Edited',
        text: commentText('New text'),
      })
    );
  });

  it('shows why editing failed in the open edit editor', () => {
    renderItem({
      userCanEdit: true,
      openEditorsState: { 'edit:mine': true },
      edit: mockMutationResult<EditCommentMutation>({
        called: true,
        error: new Error('Editing failed.'),
      }),
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Editing failed.');
  });

  it('does not offer editing when editing is turned off', () => {
    renderItem({ userCanEdit: false });

    expect(
      screen.queryByRole('button', { name: t('comments.list.edit') })
    ).not.toBeInTheDocument();
  });

  it('does not offer editing comments of other people', () => {
    renderItem({ ...guestComment('other'), userCanEdit: true });

    expect(
      screen.queryByRole('button', { name: t('comments.list.edit') })
    ).not.toBeInTheDocument();
  });

  it('does not offer editing to guests', () => {
    renderItem({ userCanEdit: true }, { loggedIn: false });

    expect(
      screen.queryByRole('button', { name: t('comments.list.edit') })
    ).not.toBeInTheDocument();
  });

  it.each([
    [CommentState.PendingApproval, 'comments.list.pendingApproval'],
    [CommentState.PendingUserChanges, 'comments.list.pendingUserChanges'],
    [CommentState.Rejected, 'comments.list.rejected'],
  ])('explains the %s state', (state, key) => {
    renderItem({ state });

    expect(screen.getByRole('alert')).toHaveTextContent(t(key));
  });

  it('shows no state warning for approved comments', () => {
    renderItem({ state: CommentState.Approved });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('lets the author fix a comment that needs changes even when editing is turned off', () => {
    renderItem({ state: CommentState.PendingUserChanges, userCanEdit: false });

    expect(
      screen.getByRole('button', { name: t('comments.list.edit') })
    ).toBeInTheDocument();
  });

  it('shows the replies without their rating answers', () => {
    renderItem({ children: [guestComment('reply', [guestComment('nested')])] });

    const [replies] = screen.getAllByRole('complementary');

    expect(
      within(replies).getByRole('heading', { name: 'Comment reply' })
    ).toBeInTheDocument();
    expect(
      within(replies).getByRole('heading', { name: 'Comment nested' })
    ).toBeInTheDocument();
    expect(screen.getAllByText('Relevance')).toHaveLength(1);
  });

  it('replies to a nested reply with its own id as parent', async () => {
    const user = userEvent.setup();
    const { onAddComment } = renderItem({
      children: [guestComment('reply')],
    });

    const [, replyButton] = screen.getAllByRole('button', {
      name: t('comments.list.reply'),
    });
    await user.click(replyButton);
    await writeComment(user, 'Re', 'Nested');

    await waitFor(() =>
      expect(onAddComment).toHaveBeenCalledWith(
        expect.objectContaining({ parentID: 'reply' })
      )
    );
  });

  it('stops offering replies once the maximum depth is reached', () => {
    renderItem({
      commentDepth: 0,
      maxCommentDepth: 1,
      children: [guestComment('reply', [guestComment('nested')])],
    });

    expect(
      screen.getAllByRole('button', { name: t('comments.list.reply') })
    ).toHaveLength(1);
  });
});
