import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockChallenge,
  mockComment,
  mockCommentRatingSystem,
  mockMutationResult,
  mockSensitiveDataUser,
  createCommentRatingContext,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  AddCommentMutation,
  CommentListQuery,
  EditCommentMutation,
} from '@wepublish/website/api';
import { BuilderCommentListProps } from '@wepublish/website/builder';
import { t } from 'i18next';
import { useReducer } from 'react';
import { CommentList } from './comment-list';
import { commentListReducer } from './comment-list.state';

const comment = (id: string, children: ReturnType<typeof mockComment>[] = []) =>
  mockComment({ id, title: `Comment ${id}`, user: null, children });

const data: CommentListQuery = {
  __typename: 'Query',
  commentsForItem: [
    comment('1'),
    comment('2', [comment('2-1', [comment('2-1-1')])]),
    comment('3'),
  ],
  ratingSystem: mockCommentRatingSystem(),
};

type ListProps = Omit<
  BuilderCommentListProps,
  'openEditorsStateDispatch' | 'onAddComment' | 'onEditComment'
>;

const Harness = (
  props: ListProps &
    Pick<BuilderCommentListProps, 'onAddComment' | 'onEditComment'>
) => {
  const [openEditorsState, dispatch] = useReducer(
    commentListReducer,
    props.openEditorsState
  );

  return (
    <CommentList
      {...props}
      openEditorsState={openEditorsState}
      openEditorsStateDispatch={dispatch}
    />
  );
};

const renderList = (
  props: Partial<ListProps> = {},
  { loggedIn = true }: { loggedIn?: boolean } = {}
) => {
  const onAddComment = vi.fn<BuilderCommentListProps['onAddComment']>();
  const onEditComment = vi.fn<BuilderCommentListProps['onEditComment']>();

  renderWithProviders(
    <Harness
      data={data}
      loading={false}
      error={undefined}
      variables={{}}
      onVariablesChange={vi.fn()}
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
      user: loggedIn ? mockSensitiveDataUser() : null,
      commentRating: createCommentRatingContext(),
    }
  );

  return { onAddComment, onEditComment };
};

const newComment = () =>
  screen.getByRole('button', { name: t('comments.list.readMore') });

describe('CommentList', () => {
  it('shows every comment and every reply', () => {
    renderList();

    for (const id of ['1', '2', '2-1', '2-1-1', '3']) {
      expect(
        screen.getByRole('heading', { name: `Comment ${id}` })
      ).toBeInTheDocument();
    }

    expect(
      screen.getAllByRole('button', { name: t('comments.list.reply') })
    ).toHaveLength(5);
  });

  it('passes the maximum depth on to the replies', () => {
    renderList({ maxCommentDepth: 1 });

    expect(
      screen.getAllByRole('button', { name: t('comments.list.reply') })
    ).toHaveLength(3);
  });

  it('says there are no comments yet', () => {
    renderList({ data: { ...data, commentsForItem: [] } });

    expect(screen.getByRole('alert')).toHaveTextContent(
      t('comments.list.noComments')
    );
  });

  it('does not claim there are no comments while they load', () => {
    renderList({ data: undefined, loading: true });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows why the comments could not be loaded', () => {
    renderList({ data: undefined, error: new Error('Comments are down.') });

    expect(screen.getByRole('alert')).toHaveTextContent('Comments are down.');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('writes a new top level comment', async () => {
    const user = userEvent.setup();
    const { onAddComment } = renderList();

    await user.click(newComment());
    await user.type(
      await screen.findByLabelText(t('commentEditor.title')),
      'Hello'
    );
    await user.type(screen.getByLabelText(t('commentEditor.text')), 'World');
    await user.click(
      screen.getByRole('button', { name: t('commentEditor.comment') })
    );

    await waitFor(() =>
      expect(onAddComment).toHaveBeenCalledWith({
        title: 'Hello',
        text: {
          type: 'doc',
          attrs: undefined,
          content: [
            {
              type: 'paragraph',
              attrs: {},
              content: [{ type: 'text', text: 'World', attrs: undefined }],
            },
          ],
        },
      })
    );
  });

  it('closes the new comment editor on cancel', async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(newComment());
    await user.click(
      await screen.findByRole('button', { name: t('commentEditor.cancel') })
    );

    expect(
      screen.queryByLabelText(t('commentEditor.title'))
    ).not.toBeInTheDocument();
  });

  it('shows why the new comment could not be saved', () => {
    renderList({
      openEditorsState: { 'add:null': true },
      add: mockMutationResult<AddCommentMutation>({
        called: true,
        error: new Error('Saving failed.'),
      }),
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Saving failed.');
  });

  it('lets guests comment without an account when guests may comment', async () => {
    const user = userEvent.setup();
    renderList({ anonymousCanComment: true }, { loggedIn: false });

    await user.click(newComment());
    await user.click(
      await screen.findByRole('button', {
        name: t('commentEditor.guestComment'),
      })
    );

    expect(
      await screen.findByLabelText(t('commentEditor.name'))
    ).toBeInTheDocument();
  });
});
