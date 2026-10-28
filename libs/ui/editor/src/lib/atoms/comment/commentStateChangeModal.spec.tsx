import { useMutation } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import {
  CommentRejectionReason,
  CommentState,
  FullCommentFragment,
} from '@wepublish/editor/api';
import type { Mock } from 'vitest';

import { CommentStateChangeModal } from './commentStateChangeModal';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useMutation: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(',')}` : key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@wepublish/richtext', () => ({
  toPlaintext: (content: unknown) => content,
}));

const theme = createTheme({ cssVariables: true });
const mockedUseMutation = useMutation as unknown as Mock;
const mutate = vi.fn();

const revision = (content: string, createdAt: string) => ({
  text: { content },
  title: null,
  lead: null,
  createdAt,
});

const comment = (overrides: Partial<FullCommentFragment> = {}) =>
  ({
    id: 'comment-1',
    state: CommentState.PendingApproval,
    rejectionReason: null,
    guestUsername: null,
    user: { id: 'u1', name: 'Ada Lovelace' },
    createdAt: '2026-10-24T18:38:00.000Z',
    modifiedAt: '2026-10-24T18:38:00.000Z',
    parentComment: null,
    revisions: [revision('Latest words', '2026-10-24T18:38:00.000Z')],
    ...overrides,
  }) as unknown as FullCommentFragment;

const renderModal = (
  props: Partial<Parameters<typeof CommentStateChangeModal>[0]> = {}
) =>
  render(
    <ThemeProvider theme={theme}>
      <CommentStateChangeModal
        comment={comment()}
        newCommentState={CommentState.Approved}
        {...props}
      />
    </ThemeProvider>
  );

beforeEach(() => {
  mutate.mockReset();
  mockedUseMutation.mockReset();
  mockedUseMutation.mockReturnValue([mutate, { loading: false }]);
});

describe('CommentStateChangeModal', () => {
  it('shows the comment that is being decided on', () => {
    renderModal();

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Latest words')).toBeVisible();
    expect(within(dialog).getByText(/Ada Lovelace/)).toBeVisible();
  });

  it('keeps earlier revisions out of the way', () => {
    renderModal({
      comment: comment({
        revisions: [
          revision('First draft', '2026-10-23T10:00:00.000Z'),
          revision('Latest words', '2026-10-24T18:38:00.000Z'),
        ],
      }),
    });

    expect(screen.getByText('Latest words')).toBeVisible();
    expect(screen.queryByText('First draft')).not.toBeVisible();
  });

  it('names the author of the comment being replied to', () => {
    renderModal({
      comment: comment({
        parentComment: {
          id: 'parent',
          user: { id: 'u2', name: 'Grace Hopper' },
          guestUsername: null,
          createdAt: '2026-10-22T10:00:00.000Z',
          revisions: [revision('Original post', '2026-10-22T10:00:00.000Z')],
        } as unknown as FullCommentFragment['parentComment'],
      }),
    });

    expect(screen.getByText(/Grace Hopper/)).toBeInTheDocument();
    expect(screen.getByText('Original post')).toBeInTheDocument();
  });

  it('closes on escape', () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('cannot request changes until a reason is picked', () => {
    renderModal({ newCommentState: CommentState.PendingUserChanges });

    expect(
      screen.getByRole('button', { name: 'comments.panels.requestChanges' })
    ).toBeDisabled();
  });

  it('rejects with the reason that was picked', () => {
    renderModal({ newCommentState: CommentState.Rejected });

    const confirm = screen.getByRole('button', {
      name: 'comments.panels.reject',
    });
    expect(confirm).toBeDisabled();

    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: /comments.panels.rejectionReason/ })
    );
    fireEvent.click(
      screen.getByRole('option', {
        name: 'comments.panels.rejectionReasons.spam',
      })
    );
    fireEvent.click(confirm);

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          id: 'comment-1',
          rejectionReason: CommentRejectionReason.Spam,
        },
      })
    );
  });

  it('marks rejecting as destructive', () => {
    renderModal({ newCommentState: CommentState.Rejected });

    expect(
      screen.getByRole('button', { name: 'comments.panels.reject' })
    ).toHaveClass('MuiButton-colorError');
  });

  it('shows progress while the change is saved', () => {
    mockedUseMutation.mockReturnValue([mutate, { loading: true }]);
    renderModal();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
