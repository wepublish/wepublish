import { mockTag } from '@wepublish/storybook/mocks';

import { getTagSEO } from './tag-seo';

describe('getTagSEO', () => {
  it('strips query params from the url used for canonical, og:url and schema', () => {
    const seo = getTagSEO({
      ...mockTag(),
      url: 'https://example.com/a/tag/foo?page=2',
    });

    expect(seo.url).toBe('https://example.com/a/tag/foo');
    expect(seo.schema.url).toBe('https://example.com/a/tag/foo');
  });
});
