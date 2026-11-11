import { CombinedGraphQLErrors } from '@apollo/client';

import {
  contentCacheHeaders,
  PAGE_CACHE_REVALIDATE,
} from './content-cache-control';

const revalidate = (content: unknown, errors?: unknown) =>
  Number(contentCacheHeaders(content, errors)[PAGE_CACHE_REVALIDATE]);

const article = {
  __typename: 'Article',
  latest: { blocks: [{ __typename: 'TitleBlock' }] },
};

describe('contentCacheHeaders', () => {
  it('sends exactly what next.config.js sends for a Next page', () => {
    expect(contentCacheHeaders(article)['cache-control']).toBe(
      'public, max-age=59, s-maxage=59, stale-if-error=86400'
    );
  });

  it('caches a static page for an hour, like `revalidate: 3600` did', () => {
    expect(revalidate(article)).toBe(3600);
  });

  it('drops to a minute for a page with a live block', () => {
    const withPoll = {
      __typename: 'Article',
      latest: { blocks: [{ __typename: 'PollBlock' }] },
    };

    expect(revalidate(withPoll)).toBe(60);
  });

  it('drops to a minute when the content is missing', () => {
    expect(revalidate(undefined)).toBe(60);
    expect(revalidate(null)).toBe(60);
  });

  it('drops to a minute when the api reported errors alongside content', () => {
    const errors = new CombinedGraphQLErrors({
      data: null,
      errors: [{ message: 'nope' }],
    });

    expect(revalidate(article, errors)).toBe(60);
  });

  it('shortens to the next scheduled block change', () => {
    const changesSoon = {
      ...article,
      blocksChangeAt: new Date(Date.now() + 10_000).toISOString(),
    };

    expect(revalidate(changesSoon)).toBeLessThanOrEqual(10);
  });

  /**
   * `revalidateFor` throws on a server error with no content, which is how it
   * failed a Next build. Here it would take down the route instead.
   */
  it('falls back to a minute instead of throwing on a server error', () => {
    const serverError = new CombinedGraphQLErrors({
      data: null,
      errors: [
        { message: 'boom', extensions: { code: 'INTERNAL_SERVER_ERROR' } },
      ],
    });

    expect(revalidate(undefined, serverError)).toBe(60);
  });
});
