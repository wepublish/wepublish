import { render } from '@testing-library/react';
import { ComponentType } from 'react';

import { Route as ArticleById } from '../routes/a/id/$id';
import { Route as ArticleBySlug } from '../routes/a/$slug';

const articlePage = vi.hoisted(() => vi.fn((_props: object) => null));

vi.mock(
  '../../../../libs/utils/website/src/tanstack/pages/article-page',
  async importOriginal => ({
    ...(await importOriginal<object>()),
    ArticlePage: articlePage,
  })
);

/**
 * `EenewsArticle` renders its own related articles and comments inside the
 * article layout. The shared `ArticlePage` would add a second, full-width copy
 * of each below it.
 */
describe('ee-news article routes', () => {
  beforeEach(() => articlePage.mockClear());

  it.each([
    ['/a/$slug', ArticleBySlug],
    ['/a/id/$id', ArticleById],
  ])('%s leaves related articles and comments to EenewsArticle', (_, route) => {
    const Component = route.options.component as ComponentType;

    render(<Component />);

    expect(articlePage).toHaveBeenCalledWith(
      expect.objectContaining({ relatedTitle: null, commentsTitle: null }),
      undefined
    );
  });
});
