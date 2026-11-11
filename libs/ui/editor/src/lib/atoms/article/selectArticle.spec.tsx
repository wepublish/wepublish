import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  type ArticleListQuery,
  type ArticleListQueryVariables,
  ArticleListDocument,
  ArticleSort,
  SortOrder,
} from '@wepublish/editor/api';
import { type ReactElement, useState } from 'react';

import { SelectArticle } from './selectArticle';

type ArticleNode = ArticleListQuery['articles']['nodes'][number];

const theme = createTheme({ cssVariables: true });

const timestamp = '2026-01-01T00:00:00.000Z';

const article = (id: string, title: string | null): ArticleNode => ({
  __typename: 'Article',
  id,
  publishedAt: timestamp,
  createdAt: timestamp,
  modifiedAt: timestamp,
  shared: false,
  hidden: false,
  disableComments: false,
  slug: id,
  likes: 0,
  url: `https://example.com/a/${id}`,
  previewUrl: `https://example.com/a/${id}/preview`,
  paywallId: null,
  latest: {
    __typename: 'ArticleRevision',
    id: `${id}-revision`,
    createdAt: timestamp,
    publishedAt: timestamp,
    archivedAt: null,
    preTitle: null,
    title,
    lead: null,
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    hideAuthor: false,
    breaking: false,
    socialMediaTitle: null,
    socialMediaDescription: null,
    authors: [],
    socialMediaAuthors: [],
    image: null,
    socialMediaImage: null,
    properties: [],
  },
  draft: null,
  pending: null,
  published: null,
  tags: [],
  peer: null,
  trackingPixels: [],
});

const latest = [
  article('article-1', 'Neueste Meldung'),
  article('article-2', 'Gestern'),
  article('article-3', null),
];
const older = Array.from({ length: 200 }, (_, index) =>
  article(`article-old-${index}`, `Alt ${index}`)
);
const archived = article('article-archived', 'Archivperle');

let requests: ArticleListQueryVariables[] = [];

const articleListMock = (articles: ArticleNode[]) => ({
  request: { query: ArticleListDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: ArticleListQueryVariables) => {
    requests.push(variables);

    const ids = variables.filter?.ids;
    const title = variables.filter?.title?.toLowerCase();
    const found = articles.filter(
      node =>
        (!ids || ids.includes(node.id)) &&
        (!title || (node.latest.title ?? '').toLowerCase().includes(title))
    );
    const data: ArticleListQuery = {
      __typename: 'Query',
      articles: {
        __typename: 'PaginatedArticles',
        nodes: found.slice(0, variables.take ?? found.length),
        pageInfo: {
          __typename: 'PageInfo',
          startCursor: null,
          endCursor: null,
          hasNextPage: found.length > (variables.take ?? found.length),
          hasPreviousPage: false,
        },
        totalCount: found.length,
      },
    };

    return { data };
  },
});

function Picker({
  initial = null,
  onPick = vi.fn(),
}: {
  initial?: string | null;
  onPick?: (id: string | null) => void;
}) {
  const [selected, setSelected] = useState(initial);

  return (
    <SelectArticle
      selectedArticle={selected}
      setSelectedArticle={id => {
        setSelected(id);
        onPick(id);
      }}
    />
  );
}

const renderPicker = (picker: ReactElement, articles: ArticleNode[] = latest) =>
  render(
    <ThemeProvider theme={theme}>
      <MockedProvider mocks={[articleListMock(articles)]}>
        {picker}
      </MockedProvider>
    </ThemeProvider>
  );

beforeEach(() => {
  requests = [];
});

describe('SelectArticle', () => {
  it('offers the latest articles first and names an untitled one', async () => {
    const user = userEvent.setup();

    renderPicker(<Picker />);

    await user.click(screen.getByRole('combobox'));

    await screen.findByRole('option', { name: 'Neueste Meldung' });
    expect(
      screen.getAllByRole('option').map(option => option.textContent)
    ).toEqual(['Neueste Meldung', 'Gestern', 'articles.overview.untitled']);
    expect(requests[0]).toEqual({
      sort: ArticleSort.PublishedAt,
      order: SortOrder.Descending,
      take: 200,
    });
  });

  it('searches the articles by title on the server', async () => {
    const user = userEvent.setup();

    renderPicker(<Picker />);

    await user.type(screen.getByRole('combobox'), 'gest');

    await waitFor(() =>
      expect(
        screen.getAllByRole('option').map(option => option.textContent)
      ).toEqual(['Gestern'])
    );
    expect(requests.at(-1)).toEqual({
      sort: ArticleSort.PublishedAt,
      order: SortOrder.Descending,
      take: 200,
      filter: { title: 'gest' },
    });
  });

  it('hands on the id of the picked article without asking for it again', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();

    renderPicker(<Picker onPick={onPick} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Gestern' }));

    expect(onPick).toHaveBeenCalledWith('article-2');
    expect(screen.getByRole('combobox')).toHaveValue('Gestern');
    expect(requests.some(variables => variables.filter?.ids)).toBe(false);
  });

  it('names a stored article that is not among the latest ones through its id', async () => {
    renderPicker(<Picker initial="article-archived" />, [...older, archived]);

    await waitFor(() =>
      expect(screen.getByRole('combobox')).toHaveValue('Archivperle')
    );
    expect(requests).toContainEqual({
      filter: { ids: ['article-archived'] },
      take: 1,
    });
  });

  it('asks for no single article while nothing is picked', async () => {
    const user = userEvent.setup();

    renderPicker(<Picker />);

    await user.click(screen.getByRole('combobox'));
    await screen.findByRole('option', { name: 'Gestern' });

    expect(requests.some(variables => variables.filter?.ids)).toBe(false);
  });

  it('can be cleared', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();

    renderPicker(
      <Picker
        initial="article-1"
        onPick={onPick}
      />
    );

    await waitFor(() =>
      expect(screen.getByRole('combobox')).toHaveValue('Neueste Meldung')
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onPick).toHaveBeenCalledWith(null);
  });
});
