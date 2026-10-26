import '@testing-library/jest-dom/vitest';

import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { FullUserFragment } from '@wepublish/editor/api';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import type { Mock } from 'vitest';

import { UserSearch } from './userSearch';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const theme = createTheme({ cssVariables: true });

const user = {
  id: 'user-1',
  name: 'Wyss',
  firstName: 'Matteo',
  email: 'matteo@test.ch',
} as unknown as FullUserFragment;

const renderSearch = (ui: ReactNode) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const clearIcon = () =>
  document.querySelector('.MuiAutocomplete-clearIndicator');

beforeEach(() => {
  mockedUseQuery.mockReset();
  mockedUseQuery.mockReturnValue({
    data: { users: { nodes: [user] } },
    loading: false,
  });
});

const type = (value: string) => {
  const combobox = screen.getByRole('combobox');

  combobox.focus();
  fireEvent.change(combobox, { target: { value } });
};

describe('UserSearch', () => {
  it('keeps what was typed when fresh results arrive', () => {
    mockedUseQuery.mockImplementation(() => ({
      data: { users: { nodes: [{ ...user }] } },
      loading: false,
    }));

    renderSearch(
      <UserSearch
        name="user"
        user={user}
        onUpdateUser={vi.fn()}
      />
    );

    type('anna');

    expect(screen.getByRole('combobox')).toHaveValue('anna');
  });

  it('stays typeable while the search is running', () => {
    mockedUseQuery.mockImplementation(
      (
        _document: unknown,
        options: { variables?: { filter?: { text?: string } } }
      ) => ({
        data: { users: { nodes: [user] } },
        loading: !!options?.variables?.filter?.text,
      })
    );

    renderSearch(
      <UserSearch
        name="user"
        onUpdateUser={vi.fn()}
      />
    );

    type('ann');

    expect(screen.getByRole('combobox')).not.toBeDisabled();
    expect(screen.getByRole('combobox')).toHaveValue('ann');
  });

  it('asks for nothing while the field is closed', () => {
    renderSearch(
      <UserSearch
        name="user"
        user={user}
        onUpdateUser={vi.fn()}
      />
    );

    expect(mockedUseQuery.mock.calls.at(-1)?.[1]?.skip).toBe(true);
  });

  it('stops asking once a user was picked', async () => {
    const onUpdateUser = vi.fn();

    renderSearch(
      <UserSearch
        name="user"
        onUpdateUser={onUpdateUser}
      />
    );

    type('matteo');
    fireEvent.click(await screen.findByText(/Matteo Wyss/));

    expect(onUpdateUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1' })
    );
    expect(mockedUseQuery.mock.calls.at(-1)?.[1]?.skip).toBe(true);
  });

  it('searches on the server', async () => {
    renderSearch(
      <UserSearch
        name="user"
        onUpdateUser={vi.fn()}
      />
    );

    type('matteo');

    await waitFor(() =>
      expect(
        mockedUseQuery.mock.calls.some(
          call => call[1]?.variables?.filter?.text === 'matteo'
        )
      ).toBe(true)
    );
  });

  it('asks for everyone again once the search is abandoned', async () => {
    renderSearch(
      <UserSearch
        name="user"
        onUpdateUser={vi.fn()}
      />
    );

    type('matteo');
    fireEvent.blur(screen.getByRole('combobox'));

    await waitFor(() =>
      expect(
        mockedUseQuery.mock.calls.at(-1)?.[1]?.variables?.filter?.text
      ).toBe('')
    );
  });

  it('lets the picked user be cleared', () => {
    renderSearch(
      <UserSearch
        name="user"
        user={user}
        onUpdateUser={vi.fn()}
      />
    );

    expect(clearIcon()).toBeInTheDocument();
  });

  it('keeps the user where the form cannot do without one', () => {
    renderSearch(
      <UserSearch
        name="user"
        user={user}
        disableClearable
        onUpdateUser={vi.fn()}
      />
    );

    expect(clearIcon()).toBeNull();
  });
});
