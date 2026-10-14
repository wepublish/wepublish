import { mockEvent } from '@wepublish/storybook/mocks';

import { getEventSEO } from './event-seo';

describe('getEventSEO', () => {
  it('strips query params from the url used for canonical and og:url', () => {
    const seo = getEventSEO({
      ...mockEvent(),
      url: 'https://example.com/event/abc?from=newsletter',
    });

    expect(seo.url).toBe('https://example.com/event/abc');
  });
});
