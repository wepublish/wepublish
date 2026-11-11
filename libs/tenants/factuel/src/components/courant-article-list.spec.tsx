import { screen } from '@testing-library/react';
import {
  mockArticle,
  mockArticleRevision,
  mockPaginated,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullArticleFragment } from '@wepublish/website/api';
import { t } from 'i18next';

import { CourantArticleList } from './courant-article-list';

const articleTitled = (title: string) =>
  mockArticle({ latest: mockArticleRevision({ title }) });

const renderList = (articles: FullArticleFragment[]) =>
  renderWithProviders(
    <CourantArticleList
      data={{
        __typename: 'Query',
        articles: mockPaginated('PaginatedArticles', articles),
      }}
      loading={false}
      error={undefined}
      variables={{}}
    />
  );

describe('CourantArticleList', () => {
  it('renders teasers without the related-articles heading so it fits archive/tag/author pages', () => {
    renderList([articleTitled('An article')]);

    expect(
      screen.queryByRole('heading', { name: t('article.related') })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'An article' })
    ).toBeInTheDocument();
  });
});
