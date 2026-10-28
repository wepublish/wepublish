import { screen } from '@testing-library/react';
import {
  mockArticle,
  mockArticleRevision,
  mockOperation,
  mockPaginated,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  ArticleListDocument,
  ArticleSort,
  SortOrder,
} from '@wepublish/website/api';
import { ArticleListContainer } from './article-list-container';

const articleTitled = (title: string) =>
  mockArticle({ latest: mockArticleRevision({ title }) });

const first = articleTitled('First article');
const second = articleTitled('Second article');
const third = articleTitled('Third article');

const articleListQuery = (variables = {}) =>
  mockOperation(ArticleListDocument, {
    variables,
    data: {
      __typename: 'Query',
      articles: mockPaginated('PaginatedArticles', [first, second, third]),
    },
  });

const teaserTitles = async () =>
  (await screen.findAllByRole('heading', { name: /article$/ })).map(
    heading => heading.textContent
  );

describe('ArticleListContainer', () => {
  it('lists the loaded articles', async () => {
    renderWithProviders(<ArticleListContainer />, {
      mocks: [articleListQuery()],
    });

    expect(await teaserTitles()).toEqual([
      'First article',
      'Second article',
      'Third article',
    ]);
  });

  it('loads the articles with the given variables', async () => {
    const variables = {
      take: 3,
      sort: ArticleSort.PublishedAt,
      order: SortOrder.Descending,
    };

    renderWithProviders(<ArticleListContainer variables={variables} />, {
      mocks: [articleListQuery(variables)],
    });

    expect(await teaserTitles()).toHaveLength(3);
  });

  it('leaves out the articles the filter removes', async () => {
    renderWithProviders(
      <ArticleListContainer
        filter={articles => articles.filter(({ id }) => id !== second.id)}
      />,
      { mocks: [articleListQuery()] }
    );

    expect(await teaserTitles()).toEqual(['First article', 'Third article']);
  });
});
