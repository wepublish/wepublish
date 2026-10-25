import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FullCommentFragment } from '@wepublish/editor/api';
import { ReactNode } from 'react';

import { CommentDeleteBtn } from './commentDeleteBtn';

vi.mock('@apollo/client/react', () => ({
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('../permissionControl', () => ({
  PermissionControl: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const theme = createTheme({ cssVariables: true });

describe('CommentDeleteBtn', () => {
  it('closes the confirmation on Escape', async () => {
    render(
      <ThemeProvider theme={theme}>
        <CommentDeleteBtn comment={{ id: 'c1' } as FullCommentFragment} />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'delete' }));

    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
  });

  it('names the confirmation after its title', () => {
    render(
      <ThemeProvider theme={theme}>
        <CommentDeleteBtn comment={{ id: 'c1' } as FullCommentFragment} />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'delete' }));

    expect(
      screen.getByRole('dialog', { name: 'commentDeleteBtn.modalTitle' })
    ).toBeInTheDocument();
  });
});
