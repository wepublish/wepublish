import { mockArticle, mockArticleRevision } from '@wepublish/storybook/mocks';

import { getArticleSEO } from './article-seo';

describe('getArticleSEO', () => {
  it('strips query params from the url used for canonical, og:url and schema', () => {
    const seo = getArticleSEO({
      ...mockArticle({
        latest: mockArticleRevision({ canonicalUrl: null }),
      }),
      url: 'https://example.com/a/slug?articleId=abc&preview',
    });

    expect(seo.url).toBe('https://example.com/a/slug');
    expect(seo.schema.url).toBe('https://example.com/a/slug');
  });

  it('keeps the canonical url an editor set explicitly', () => {
    const seo = getArticleSEO({
      ...mockArticle({
        latest: mockArticleRevision({
          canonicalUrl: 'https://partner.example.com/story?id=42',
        }),
      }),
      url: 'https://example.com/a/slug?articleId=abc',
    });

    expect(seo.url).toBe('https://partner.example.com/story?id=42');
  });
});
