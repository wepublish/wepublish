import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { CommentState, FullCommentFragment } from '@wepublish/editor/api';

import { CommentStateChangeModal } from './commentStateChangeModal';

vi.mock('@apollo/client/react', () => ({
  useMutation: () => [vi.fn(), { loading: false, error: undefined }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const theme = createTheme({ cssVariables: true });

describe('CommentStateChangeModal', () => {
  it('closes on Escape', () => {
    const onClose = vi.fn();

    render(
      <ThemeProvider theme={theme}>
        <CommentStateChangeModal
          comment={
            {
              id: 'c1',
              state: CommentState.PendingApproval,
              revisions: [],
              modifiedAt: '2026-01-01T00:00:00.000Z',
            } as unknown as FullCommentFragment
          }
          newCommentState={CommentState.Approved}
          onClose={onClose}
        />
      </ThemeProvider>
    );

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });
});
