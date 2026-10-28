import { CombinedGraphQLErrors } from '@apollo/client';

import { contentCacheControl } from './content-cache-control';

const sMaxAge = (header: string) => Number(/s-maxage=(\d+)/.exec(header)?.[1]);

const article = {
  __typename: 'Article',
  latest: { blocks: [{ __typename: 'TitleBlock' }] },
};

describe('contentCacheControl', () => {
  it('caches a static page for an hour, like `revalidate: 3600` did', () => {
    expect(sMaxAge(contentCacheControl(article))).toBe(3600);
  });

  it('drops to a minute for a page with a live block', () => {
    const withPoll = {
      __typename: 'Article',
      latest: { blocks: [{ __typename: 'PollBlock' }] },
    };

    expect(sMaxAge(contentCacheControl(withPoll))).toBe(60);
  });

  it('drops to a minute when the content is missing', () => {
    expect(sMaxAge(contentCacheControl(undefined))).toBe(60);
    expect(sMaxAge(contentCacheControl(null))).toBe(60);
  });

  it('drops to a minute when the api reported errors alongside content', () => {
    const errors = new CombinedGraphQLErrors({
      data: null,
      errors: [{ message: 'nope' }],
    });

    expect(sMaxAge(contentCacheControl(article, errors))).toBe(60);
  });

  it('shortens to the next scheduled block change', () => {
    const changesSoon = {
      ...article,
      blocksChangeAt: new Date(Date.now() + 10_000).toISOString(),
    };

    expect(sMaxAge(contentCacheControl(changesSoon))).toBeLessThanOrEqual(10);
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

    expect(sMaxAge(contentCacheControl(undefined, serverError))).toBe(60);
  });

  it('keeps the directives the page cache and the CDN rely on', () => {
    const header = contentCacheControl(article);

    expect(header).toContain('public');
    expect(header).toContain('max-age=0');
    expect(header).toContain('stale-while-revalidate=604800');
    expect(header).toContain('stale-if-error=86400');
  });
});
