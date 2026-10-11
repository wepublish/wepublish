import { mockPage } from '@wepublish/storybook/mocks';

import { getPageSEO } from './page-seo';

describe('getPageSEO', () => {
  it('strips query params from the url used for canonical, og:url and schema', () => {
    const seo = getPageSEO({
      ...mockPage(),
      url: 'https://example.com/slug?page=2&from=newsletter',
    });

    expect(seo.url).toBe('https://example.com/slug');
    expect(seo.schema.url).toBe('https://example.com/slug');
  });
});
