import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { UserCheckPicker } from './userCheckPicker';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const ada = { id: 'u1', name: 'Ada Lovelace' };
const grace = { id: 'u2', name: 'Grace Hopper' };

const renderPicker = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <UserCheckPicker
        list={[]}
        onChange={vi.fn()}
        {...(props as object)}
      />
    </ThemeProvider>
  );

beforeEach(() => {
  mockedUseQuery.mockReset();
  mockedUseQuery.mockReturnValue({
    data: { users: { nodes: [ada, grace] } },
    loading: false,
  });
});

describe('UserCheckPicker', () => {
  it('offers the users the query returned', async () => {
    renderPicker();

    fireEvent.mouseDown(screen.getByRole('combobox'));

    await waitFor(() =>
      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    );
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
  });

  it('shows the already selected users as tags', () => {
    renderPicker({ list: [grace] });

    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
  });

  it('reports the whole user, not just the id', async () => {
    const onChange = vi.fn();
    renderPicker({ onChange });

    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByText('Ada Lovelace'));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'u1' }),
    ]);
  });

  it('searches on the server as the user types', async () => {
    renderPicker();

    const combobox = screen.getByRole('combobox');
    combobox.focus();
    fireEvent.mouseDown(combobox);
    fireEvent.change(combobox, { target: { value: 'grace' } });

    await waitFor(() =>
      expect(
        mockedUseQuery.mock.calls.some(
          call => call[1]?.variables?.filter?.text === 'grace'
        )
      ).toBe(true)
    );
  });

  it('keeps every option the server returned', async () => {
    renderPicker();

    const combobox = screen.getByRole('combobox');
    combobox.focus();
    fireEvent.mouseDown(combobox);
    fireEvent.change(combobox, { target: { value: 'zzz' } });

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('keeps a selected user listed even when the search no longer returns them', () => {
    mockedUseQuery.mockReturnValue({
      data: { users: { nodes: [ada] } },
      loading: false,
    });
    renderPicker({ list: [grace] });

    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
  });

  it('does not collapse when its container gives it no width', () => {
    renderPicker();

    expect(
      screen.getByRole('combobox').closest('.MuiAutocomplete-root')
    ).toHaveStyle({ minWidth: '200px' });
  });
});
