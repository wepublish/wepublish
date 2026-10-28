import { screen } from '@testing-library/react';
import {
  mockArticle,
  mockArticleRevision,
  mockPaginated,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullArticleFragment } from '@wepublish/website/api';
import { ArticleList, articleToTeaser } from './article-list';

const articleTitled = (title: string) =>
  mockArticle({ latest: mockArticleRevision({ title }) });

const renderList = (articles: FullArticleFragment[] | null) =>
  renderWithProviders(
    <ArticleList
      data={
        articles ?
          {
            __typename: 'Query',
            articles: mockPaginated('PaginatedArticles', articles),
          }
        : undefined
      }
      loading={!articles}
      error={undefined}
      variables={{}}
    />
  );

describe('ArticleList', () => {
  it('renders a teaser for every article in order', () => {
    renderList([
      articleTitled('First article'),
      articleTitled('Second article'),
      articleTitled('Third article'),
    ]);

    expect(
      screen
        .getAllByRole('heading', { name: /article$/ })
        .map(h => h.textContent)
    ).toEqual(['First article', 'Second article', 'Third article']);
  });

  it('links every teaser to its article', () => {
    const article = mockArticle({
      url: 'https://example.com/a/first',
      latest: mockArticleRevision({ title: 'First article' }),
    });

    renderList([article]);

    expect(
      screen.getAllByRole('link').map(link => link.getAttribute('href'))
    ).toContain('https://example.com/a/first');
  });

  it('renders no teasers while the articles are loading', () => {
    renderList(null);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});

describe('articleToTeaser', () => {
  it('builds an article teaser that takes title, lead and image from the article', () => {
    const article = mockArticle();

    expect(articleToTeaser(article)).toEqual({
      __typename: 'ArticleTeaser',
      type: 'Article',
      article,
      image: null,
      lead: null,
      preTitle: null,
      title: null,
    });
  });
});
