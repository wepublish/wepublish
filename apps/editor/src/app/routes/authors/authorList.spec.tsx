import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { AuthorSort, SortOrder } from '@wepublish/editor/api';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Mock } from 'vitest';

import { AuthorList } from './authorList';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ?
        `${key}:${Object.values(options)
          .map(value =>
            value instanceof Date ? value.toISOString() : String(value)
          )
          .join(',')}`
      : key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  AuthorEditPanel: ({ id, onClose }: { id?: string; onClose: () => void }) => (
    <button
      type="button"
      onClick={onClose}
    >
      {`close ${id ?? 'new'}`}
    </button>
  ),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const author = {
  id: 'author-1',
  name: 'Ada Lovelace',
  slug: 'ada-lovelace',
  jobTitle: null,
  bio: null,
  links: [],
  peer: null,
  image: { squareURL: 'https://example.test/ada.png' },
  createdAt: '2026-01-02T10:00:00.000Z',
  modifiedAt: '2026-09-28T15:30:00.000Z',
};

const lastVariables = () => mockedUseQuery.mock.calls.at(-1)?.[1]?.variables;

const renderList = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <AuthorList />
      </MemoryRouter>
    </ThemeProvider>
  );

const renderAt = (path: string) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          {['/authors', '/authors/create', '/authors/edit/:id'].map(route => (
            <Route
              key={route}
              path={route}
              element={<AuthorList />}
            />
          ))}
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

beforeEach(() => {
  localStorage.clear();
  mockedUseQuery.mockReset();
  mockedUseQuery.mockReturnValue({
    data: {
      authors: {
        nodes: [author],
        totalCount: 1,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
      },
    },
    loading: false,
    refetch: vi.fn(),
  });
});

describe('AuthorList', () => {
  it('opens the edit drawer again for an author that was just closed', async () => {
    renderAt('/authors/edit/author-1');

    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'close author-1',
      })
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    fireEvent.click(screen.getByRole('link', { name: 'Ada Lovelace' }));

    expect(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'close author-1',
      })
    ).toBeInTheDocument();
  });

  it('names the image column header', () => {
    renderList();

    expect(
      screen.getByRole('columnheader', { name: 'authors.panels.image' })
    ).toBeInTheDocument();
  });

  it('sorts by creation date by default', () => {
    renderList();

    expect(lastVariables()).toEqual(
      expect.objectContaining({ sort: AuthorSort.CreatedAt })
    );
  });

  it('lists each author by name, linking to their edit page', async () => {
    renderList();

    const link = await screen.findByRole('link', { name: 'Ada Lovelace' });

    expect(link).toHaveAttribute('href', '/authors/edit/author-1');
  });

  it('shows when the author was created', async () => {
    renderList();

    expect(
      await screen.findByText(
        'authors.overview.createdAt:2026-01-02T10:00:00.000Z'
      )
    ).toBeTruthy();
  });

  it('sorts by name when the user clicks that column', async () => {
    renderList();

    fireEvent.click(await screen.findByText('authors.overview.name'));

    expect(lastVariables()).toEqual(
      expect.objectContaining({
        sort: AuthorSort.Name,
        order: SortOrder.Ascending,
      })
    );
  });

  it('filters by the search term', async () => {
    renderList();

    fireEvent.click(
      screen.getByRole('button', { name: /filterableList.filter.label/ })
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'search' }), {
      target: { value: 'ada' },
    });

    expect(lastVariables()).toEqual(expect.objectContaining({ filter: 'ada' }));
  });

  it('offers a delete action per author', async () => {
    renderList();

    expect(await screen.findAllByLabelText('delete')).not.toHaveLength(0);
  });
});
