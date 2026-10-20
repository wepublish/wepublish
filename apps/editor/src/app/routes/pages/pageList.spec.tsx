import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { CommentItemType, CreateCommentDocument } from '@wepublish/editor/api';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { PageList } from './pageList';

const { mutationFor } = vi.hoisted(() => {
  const mutations = new Map<unknown, ReturnType<typeof vi.fn>>();

  return {
    mutationFor: (document: unknown) => {
      if (!mutations.has(document)) {
        mutations.set(document, vi.fn());
      }

      return mutations.get(document) as ReturnType<typeof vi.fn>;
    },
  };
});

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useLazyQuery: () => [vi.fn(), { data: undefined }],
  useMutation: (document: unknown) => [
    mutationFor(document),
    { loading: false },
  ],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseQuery = useQuery as unknown as Mock;
const refetch = vi.fn();

const page = {
  __typename: 'Page',
  id: 'page-1',
  url: 'https://example.com/about',
  createdAt: '2026-01-02T10:00:00.000Z',
  modifiedAt: '2026-09-28T15:30:00.000Z',
  draft: null,
  pending: null,
  published: null,
  latest: {
    __typename: 'PageRevision',
    id: 'revision-1',
    title: 'About us',
    description: 'What we do and why',
    slug: 'about',
    createdAt: '2026-09-28T15:30:00.000Z',
    publishedAt: null,
    image: null,
    properties: [],
    tags: [],
  },
  tags: [],
};

beforeEach(() => {
  localStorage.clear();
  mockedUseQuery.mockReset();
  mockedUseQuery.mockReturnValue({
    data: {
      pages: {
        nodes: [page],
        totalCount: 1,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
      },
    },
    loading: false,
    refetch,
  });
  refetch.mockClear();
});

const renderList = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MemoryRouter>
        <PageList />
      </MemoryRouter>
    </ThemeProvider>
  );

describe('PageList', () => {
  it('does not refetch when a column is hidden', () => {
    localStorage.setItem(
      'wepublish:editor:listState:pages',
      JSON.stringify({
        filter: {},
        sortField: 'modifiedAt',
        sortOrder: 'desc',
        limit: 10,
      })
    );

    renderList();
    refetch.mockClear();

    fireEvent.click(
      screen.getByRole('button', { name: 'columnConfigurator.title' })
    );
    fireEvent.click(
      screen.getByRole('menuitemcheckbox', { name: 'pages.overview.slug' })
    );

    expect(refetch).not.toHaveBeenCalled();
  });

  it('shows the description of a page', () => {
    renderList();

    expect(screen.getByText('What we do and why')).toBeInTheDocument();
  });

  it('offers every column but the ones that name the row', () => {
    renderList();

    fireEvent.click(
      screen.getByRole('button', { name: 'columnConfigurator.title' })
    );

    expect(
      screen.getByRole('menuitemcheckbox', { name: 'pages.overview.slug' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitemcheckbox', {
        name: 'pages.overview.publicationDate',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitemcheckbox', { name: 'pages.overview.updated' })
    ).toBeInTheDocument();
  });

  it('creates comments for a page as page comments', () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <MemoryRouter>
          <PageList />
        </MemoryRouter>
      </ThemeProvider>
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'pageEditor.overview.createComment' })
    );

    expect(mutationFor(CreateCommentDocument)).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { itemID: 'page-1', itemType: CommentItemType.Page },
      })
    );
  });
});
