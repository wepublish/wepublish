import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockChallenge,
  mockChallengeToken,
  mockRichTextParagraph,
  mockSensitiveDataUser,
  renderWithProviders,
  RenderWithProvidersOptions,
  TEST_CAPTCHA_LABEL,
} from '@wepublish/mocks/website';
import { BuilderCommentEditorProps } from '@wepublish/website/builder';
import { RichtextJSONDocument } from '@wepublish/richtext';
import { t } from 'i18next';
import { CommentEditor } from './comment-editor';

type User = ReturnType<typeof userEvent.setup>;

const challenge = mockChallenge({ challengeID: 'challenge-1' });

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

type EditorOverrides = Partial<{
  maxCommentLength: number;
  loading: boolean;
  error: Error;
  anonymousCanComment: boolean;
  challenge: Parameters<typeof CommentEditor>[0]['challenge'];
  title: string;
  text: RichtextJSONDocument;
}>;

const renderEditor = (
  props: EditorOverrides = {},
  options: RenderWithProvidersOptions = {}
) => {
  const onSubmit = vi.fn<BuilderCommentEditorProps['onSubmit']>();
  const onCancel = vi.fn<BuilderCommentEditorProps['onCancel']>();

  const result = renderWithProviders(
    <CommentEditor
      {...({
        maxCommentLength: 20,
        canReply: true,
        loading: false,
        anonymousCanComment: true,
        challenge: {
          data: { __typename: 'Query', challenge },
          loading: false,
          error: undefined,
        },
        parentUrl: 'https://example.com/a/article#comment-1',
        signUpUrl: '/signup',
        onSubmit,
        onCancel,
        ...props,
      } as BuilderCommentEditorProps)}
    />,
    options
  );

  return { ...result, onSubmit, onCancel };
};

const renderLoggedInEditor = (props: EditorOverrides = {}) =>
  renderEditor(
    { challenge: null, ...props },
    { user: mockSensitiveDataUser() }
  );

const chooseGuestComment = async (user: User) =>
  user.click(
    await screen.findByRole('button', { name: t('commentEditor.guestComment') })
  );

const comment = () =>
  screen.getByRole('button', { name: t('commentEditor.comment') });

describe('CommentEditor', () => {
  describe('as a guest', () => {
    it('asks whether to comment as a guest or to log in', () => {
      renderEditor();

      expect(
        screen.getByRole('heading', { name: t('commentEditor.notLoggedIn') })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: t('commentEditor.loginRegister') })
      ).toBeInTheDocument();
    });

    it('submits the guest comment with the solved captcha', async () => {
      const user = userEvent.setup();
      const { onSubmit } = renderEditor();

      await chooseGuestComment(user);
      await user.type(screen.getByLabelText(t('commentEditor.name')), 'Foo');
      await user.type(screen.getByLabelText(t('commentEditor.title')), 'Hi');
      await user.type(
        screen.getByLabelText(t('commentEditor.text')),
        'Lorem Ipsum'
      );
      await screen.findByRole('group', { name: TEST_CAPTCHA_LABEL });
      await user.click(comment());

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith({
          guestUsername: 'Foo',
          title: 'Hi',
          challenge: {
            challengeID: 'challenge-1',
            challengeSolution: mockChallengeToken,
          },
          text: commentText('Lorem Ipsum'),
        })
      );
    });

    it('submits with the captcha that finished loading after the editor opened', async () => {
      const user = userEvent.setup();
      const { onSubmit, rerender } = renderEditor({
        challenge: { data: undefined, loading: true, error: undefined },
      });

      await chooseGuestComment(user);

      rerender(
        <CommentEditor
          maxCommentLength={20}
          canReply
          loading={false}
          anonymousCanComment
          challenge={{
            data: { __typename: 'Query', challenge },
            loading: false,
            error: undefined,
          }}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />
      );

      await user.type(screen.getByLabelText(t('commentEditor.name')), 'Foo');
      await user.type(
        screen.getByLabelText(t('commentEditor.text')),
        'Lorem Ipsum'
      );
      await screen.findByRole('group', { name: TEST_CAPTCHA_LABEL });
      await user.click(comment());

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith({
          guestUsername: 'Foo',
          title: '',
          challenge: {
            challengeID: 'challenge-1',
            challengeSolution: mockChallengeToken,
          },
          text: commentText('Lorem Ipsum'),
        })
      );
    });

    it('requires a name and a text', async () => {
      const user = userEvent.setup();
      const { onSubmit } = renderEditor();

      await chooseGuestComment(user);
      await user.click(comment());

      await waitFor(() =>
        expect(screen.getByLabelText(t('commentEditor.name'))).toHaveAttribute(
          'aria-invalid',
          'true'
        )
      );
      expect(screen.getByLabelText(t('commentEditor.text'))).toHaveAttribute(
        'aria-invalid',
        'true'
      );
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows why the captcha could not be loaded', async () => {
      const user = userEvent.setup();
      renderEditor({
        challenge: {
          data: undefined,
          loading: false,
          error: new Error('Captcha is down.'),
        },
      });

      await chooseGuestComment(user);

      expect(screen.getByRole('alert')).toHaveTextContent('Captcha is down.');
      expect(
        screen.queryByRole('group', { name: TEST_CAPTCHA_LABEL })
      ).not.toBeInTheDocument();
    });

    it('goes straight to the login when guests may not comment', () => {
      renderEditor({ anonymousCanComment: false });

      expect(
        screen.getByRole('heading', {
          name: t('commentEditor.loginForReaders'),
        })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: t('commentEditor.guestComment') })
      ).not.toBeInTheDocument();
    });

    it('offers to log in or to register after choosing to log in', async () => {
      const user = userEvent.setup();
      renderEditor();

      await user.click(
        screen.getByRole('button', { name: t('commentEditor.loginRegister') })
      );

      expect(
        screen.getByRole('heading', {
          name: t('commentEditor.loginForReaders'),
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: t('commentEditor.registerNow') })
      ).toHaveAttribute('href', '/signup');
    });

    it('remembers where to come back to when the guest registers', async () => {
      const user = userEvent.setup();
      renderEditor({ anonymousCanComment: false });

      await user.click(
        screen.getByRole('button', {
          name: new RegExp(t('commentEditor.registerNow')),
        })
      );

      expect(document.cookie).toContain(
        `auth.intended=${encodeURIComponent(
          'https://example.com/a/article#comment-1'
        )}`
      );
    });

    it('cancels when the guest closes the dialog', async () => {
      const user = userEvent.setup();
      const { onCancel } = renderEditor();

      await user.keyboard('{Escape}');

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByRole('heading', { name: t('commentEditor.notLoggedIn') })
      ).not.toBeInTheDocument();
    });
  });

  describe('as a logged in user', () => {
    it('submits the title and text without asking for a name or a captcha', async () => {
      const user = userEvent.setup();
      const { onSubmit } = renderLoggedInEditor();

      expect(
        screen.queryByLabelText(t('commentEditor.name'))
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: t('commentEditor.notLoggedIn') })
      ).not.toBeInTheDocument();

      await user.type(screen.getByLabelText(t('commentEditor.title')), 'Hi');
      await user.type(
        screen.getByLabelText(t('commentEditor.text')),
        'Lorem Ipsum'
      );
      await user.click(comment());

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith({
          title: 'Hi',
          text: commentText('Lorem Ipsum'),
        })
      );
    });

    it('requires a text', async () => {
      const user = userEvent.setup();
      const { onSubmit } = renderLoggedInEditor();

      await user.click(comment());

      await waitFor(() =>
        expect(screen.getByLabelText(t('commentEditor.text'))).toHaveAttribute(
          'aria-invalid',
          'true'
        )
      );
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('counts the characters and rejects texts over the limit', async () => {
      const user = userEvent.setup();
      const { onSubmit } = renderLoggedInEditor({ maxCommentLength: 5 });

      await user.type(screen.getByLabelText(t('commentEditor.text')), '123456');

      expect(
        screen.getByText(
          t('commentEditor.characterCount', { length: 6, max: 5 })
        )
      ).toBeInTheDocument();

      await user.click(comment());

      await waitFor(() =>
        expect(screen.getByLabelText(t('commentEditor.text'))).toHaveAttribute(
          'aria-invalid',
          'true'
        )
      );
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('starts with the existing title and text when editing', async () => {
      const user = userEvent.setup();
      const { onSubmit } = renderLoggedInEditor({
        title: 'Old title',
        text: mockRichTextParagraph('Old text'),
      });

      expect(screen.getByLabelText(t('commentEditor.title'))).toHaveValue(
        'Old title'
      );
      expect(screen.getByLabelText(t('commentEditor.text'))).toHaveValue(
        'Old text'
      );

      await user.click(comment());

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith({
          title: 'Old title',
          text: commentText('Old text'),
        })
      );
    });

    it('clears the form and cancels', async () => {
      const user = userEvent.setup();
      const { onCancel } = renderLoggedInEditor();

      await user.type(screen.getByLabelText(t('commentEditor.title')), 'Hi');
      await user.click(
        screen.getByRole('button', { name: t('commentEditor.cancel') })
      );

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(screen.getByLabelText(t('commentEditor.title'))).toHaveValue('');
    });

    it('shows why the comment could not be saved', () => {
      renderLoggedInEditor({ error: new Error('Comment is too spicy.') });

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Comment is too spicy.'
      );
    });

    it('cannot submit twice while saving', () => {
      renderLoggedInEditor({ loading: true });

      expect(comment()).toBeDisabled();
    });
  });
});
