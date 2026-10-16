import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { AuthorSort, SortOrder } from '@wepublish/editor/api';
import { MemoryRouter } from 'react-router-dom';
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
