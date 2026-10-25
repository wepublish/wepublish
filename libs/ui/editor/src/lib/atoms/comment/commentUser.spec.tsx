import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, within } from '@testing-library/react';
import { FullCommentFragment } from '@wepublish/editor/api';

import { CommentUser } from './commentUser';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: () => ({ data: undefined, loading: false }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const theme = createTheme({ cssVariables: true });

const renderUser = () =>
  render(
    <ThemeProvider theme={theme}>
      <CommentUser
        comment={{ id: 'c1' } as FullCommentFragment}
        setComment={vi.fn()}
      />
    </ThemeProvider>
  );

describe('CommentUser', () => {
  it('names the user search after its label', () => {
    renderUser();

    expect(
      screen.getByRole('combobox', { name: 'commentUser.selectExistingUser' })
    ).toBeInTheDocument();
  });

  it('groups the image picker under its label', () => {
    renderUser();

    const group = screen.getByRole('group', {
      name: 'commentUser.selectImage',
    });

    expect(
      within(group).getByRole('button', { name: 'chooseEditImage.chooseImage' })
    ).toBeInTheDocument();
  });
});
