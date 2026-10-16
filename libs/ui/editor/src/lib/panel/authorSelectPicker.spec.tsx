import { useMutation, useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { FullAuthorFragment } from '@wepublish/editor/api';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import type { Mock } from 'vitest';

import { AuthorSelectPicker } from './authorSelectPicker';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(',')}` : key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseQuery = useQuery as unknown as Mock;
const mockedUseMutation = useMutation as unknown as Mock;

const ada = { id: 'a1', name: 'Ada Lovelace', peer: null };
const grace = { id: 'a2', name: 'Grace Hopper', peer: null };

function Picker() {
  const [author, setAuthor] = useState<FullAuthorFragment | null>(null);

  return (
    <AuthorSelectPicker
      selectedAuthor={author}
      setSelectedAuthor={setAuthor}
    />
  );
}

const renderPicker = () =>
  render(
    <ThemeProvider theme={theme}>
      <Picker />
    </ThemeProvider>
  );

const combobox = () => screen.getByRole('combobox') as HTMLInputElement;

const type = (value: string) => {
  combobox().focus();
  fireEvent.mouseDown(combobox());
  fireEvent.change(combobox(), { target: { value } });
};

beforeEach(() => {
  mockedUseMutation.mockReset();
  mockedUseMutation.mockReturnValue([vi.fn(), { loading: false }]);
  mockedUseQuery.mockReset();
  mockedUseQuery.mockReturnValue({
    data: { authors: { nodes: [ada, grace] } },
    loading: false,
  });
});

describe('AuthorSelectPicker', () => {
  it('shows the name of the author that was picked', async () => {
    renderPicker();

    fireEvent.mouseDown(combobox());
    fireEvent.click(await screen.findByText('Grace Hopper'));

    await waitFor(() => expect(combobox().value).toBe('Grace Hopper'));
  });

  it('keeps showing the name after searching for somebody else', async () => {
    renderPicker();

    fireEvent.mouseDown(combobox());
    fireEvent.click(await screen.findByText('Grace Hopper'));

    type('Ada');
    fireEvent.blur(combobox());

    await waitFor(() => expect(combobox().value).toBe('Grace Hopper'));
  });

  it('searches on the server', async () => {
    renderPicker();

    type('grace');

    await waitFor(() =>
      expect(
        mockedUseQuery.mock.calls.some(
          call => call[1]?.variables?.filter === 'grace'
        )
      ).toBe(true)
    );
  });

  it('asks for everyone again once the search is abandoned', async () => {
    renderPicker();

    type('grace');
    fireEvent.blur(combobox());

    await waitFor(() =>
      expect(mockedUseQuery.mock.calls.at(-1)?.[1]?.variables?.filter).toBe(
        undefined
      )
    );
  });
});
