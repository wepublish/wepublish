import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DuplicateArticleDocument } from '@wepublish/editor/api';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { Mock } from 'vitest';

import { ArticleList } from './articleList';

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
  useApolloClient: () => ({ query: vi.fn() }),
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

vi.mock('./createArticleModal', () => ({
  CreateArticleModal: () => null,
}));

const mockedUseQuery = useQuery as unknown as Mock;

const article = {
  __typename: 'Article',
  id: 'article-1',
  url: 'https://example.com/a/hello',
  slug: 'hello',
  createdAt: '2026-01-02T10:00:00.000Z',
  modifiedAt: '2026-09-28T15:30:00.000Z',
  peer: null,
  draft: null,
  pending: null,
  published: null,
  latest: {
    __typename: 'ArticleRevision',
    id: 'revision-1',
    title: 'Hello world',
    preTitle: null,
    lead: null,
    createdAt: '2026-09-28T15:30:00.000Z',
    publishedAt: null,
    authors: [],
    puckBlocks: null as { __typename: 'PuckBlock'; id: string }[] | null,
  },
};

const LocationDisplay = () => (
  <div data-testid="location">{useLocation().pathname}</div>
);

const renderWith = (puckBlocks: typeof article.latest.puckBlocks) => {
  mockedUseQuery.mockReturnValue({
    data: {
      articles: {
        nodes: [{ ...article, latest: { ...article.latest, puckBlocks } }],
        totalCount: 1,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
      },
    },
    loading: false,
    refetch: vi.fn(),
  });

  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MemoryRouter initialEntries={['/articles']}>
        <Routes>
          <Route
            path="/articles"
            element={<ArticleList />}
          />
          <Route
            path="*"
            element={<LocationDisplay />}
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
};

beforeEach(() => {
  localStorage.clear();
  mockedUseQuery.mockReset();
});

describe('ArticleList', () => {
  describe('opening an article', () => {
    it('links an article with puck blocks to the puck editor', () => {
      renderWith([{ __typename: 'PuckBlock', id: 'heading-1' }]);

      expect(
        screen.getByRole('link', { name: 'Hello world' }).getAttribute('href')
      ).toBe('/puck/articles/edit/article-1');
    });

    it('links an article with an empty puck document to the puck editor', () => {
      renderWith([]);

      expect(
        screen.getByRole('link', { name: 'Hello world' }).getAttribute('href')
      ).toBe('/puck/articles/edit/article-1');
    });

    it('links an article without puck blocks to the legacy editor', () => {
      renderWith(null);

      expect(
        screen.getByRole('link', { name: 'Hello world' }).getAttribute('href')
      ).toBe('/articles/edit/article-1');
    });

    it('opens the duplicate of a puck article in the puck editor', async () => {
      mutationFor(DuplicateArticleDocument).mockResolvedValue({
        data: { duplicateArticle: { id: 'article-2' } },
      });
      renderWith([]);

      fireEvent.click(
        screen.getByRole('button', { name: 'articleEditor.overview.duplicate' })
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'articles.panels.confirm' })
      );

      await waitFor(() =>
        expect(screen.getByTestId('location').textContent).toBe(
          '/puck/articles/edit/article-2'
        )
      );
    });

    it('opens the duplicate of a legacy article in the legacy editor', async () => {
      mutationFor(DuplicateArticleDocument).mockResolvedValue({
        data: { duplicateArticle: { id: 'article-2' } },
      });
      renderWith(null);

      fireEvent.click(
        screen.getByRole('button', { name: 'articleEditor.overview.duplicate' })
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'articles.panels.confirm' })
      );

      await waitFor(() =>
        expect(screen.getByTestId('location').textContent).toBe(
          '/articles/edit/article-2'
        )
      );
    });
  });
});
