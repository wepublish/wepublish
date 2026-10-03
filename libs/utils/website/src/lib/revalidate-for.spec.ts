import { revalidateFor } from './revalidate-for';

const article = (blocks: unknown[]) => ({
  __typename: 'Article',
  id: 'a1',
  latest: { __typename: 'ArticleRevision', blocks },
});

const poll = { __typename: 'PollBlock', poll: { id: 'p1', answers: [] } };
const crowdfunding = {
  __typename: 'CrowdfundingBlock',
  crowdfunding: { id: 'c1', revenue: 1200 },
};
const richText = { __typename: 'RichTextBlock', richText: { type: 'doc' } };

describe('revalidateFor', () => {
  it('re-renders an article with a poll every minute', () => {
    expect(revalidateFor(article([richText, poll]))).toBe(60);
  });

  it('re-renders an article with a crowdfunding inside a flex block every minute', () => {
    expect(
      revalidateFor(
        article([
          {
            __typename: 'FlexBlock',
            blocks: [{ alignment: { x: 0 }, block: crowdfunding }],
          },
        ])
      )
    ).toBe(60);
  });

  it('re-renders an article with a crowdfunding from a block template every minute', () => {
    expect(
      revalidateFor(
        article([
          {
            __typename: 'BlockTemplateBlock',
            template: { blocks: [crowdfunding] },
          },
        ])
      )
    ).toBe(60);
  });

  it('re-renders an article that teases an article with a poll every minute', () => {
    expect(
      revalidateFor(
        article([
          {
            __typename: 'TeaserListBlock',
            teasers: [
              {
                __typename: 'ArticleTeaser',
                article: { latest: { blocks: [poll] } },
              },
            ],
          },
        ])
      )
    ).toBe(60);
  });

  it('ignores a poll that is switched off', () => {
    expect(
      revalidateFor(article([{ ...poll, disabled: true }, richText]))
    ).toBe(3600);
  });

  it('keeps an article without live numbers for an hour', () => {
    expect(revalidateFor(article([richText]))).toBe(3600);
  });

  it('re-renders a page with a poll every minute', () => {
    expect(
      revalidateFor({
        __typename: 'Page',
        latest: { __typename: 'PageRevision', blocks: [poll] },
      })
    ).toBe(60);
  });

  it('re-renders a front page that teases an article with a crowdfunding every minute', () => {
    expect(
      revalidateFor({
        __typename: 'Page',
        latest: {
          blocks: [
            {
              __typename: 'TeaserGridFlexBlock',
              flexTeasers: [
                {
                  teaser: {
                    __typename: 'ArticleTeaser',
                    article: { latest: { blocks: [crowdfunding] } },
                  },
                },
              ],
            },
          ],
        },
      })
    ).toBe(60);
  });

  it('keeps a page without live numbers for an hour', () => {
    expect(
      revalidateFor({ __typename: 'Page', latest: { blocks: [richText] } })
    ).toBe(3600);
  });

  it('re-renders after a minute when there is no content', () => {
    expect(revalidateFor(undefined)).toBe(60);
    expect(revalidateFor(null)).toBe(60);
  });

  it('re-renders after a minute when the api answered with errors', () => {
    expect(
      revalidateFor(article([richText]), [{ message: 'Database timeout' }])
    ).toBe(60);
  });

  it('keeps an hour when the api answered without errors', () => {
    expect(revalidateFor(article([richText]), [])).toBe(3600);
    expect(revalidateFor(article([richText]), undefined)).toBe(3600);
  });
});

describe('revalidateFor when the api fails', () => {
  const poolTimeout = {
    message: 'Timed out fetching a new connection from the connection pool.',
    path: ['article'],
    extensions: { code: 'INTERNAL_SERVER_ERROR' },
  };
  const unavailable = {
    message: 'Service Unavailable',
    path: ['page'],
    extensions: { code: 'INTERNAL_SERVER_ERROR', status: 503 },
  };
  const neverPublished = {
    message: 'Cannot return null for non-nullable field ArticleRevision.id.',
    path: ['article', 'latest', 'id'],
    extensions: { code: 'INTERNAL_SERVER_ERROR' },
  };
  const pendingHidden = {
    message: 'Cannot return null for non-nullable field Article.latest.',
    path: ['article', 'latest'],
    extensions: { code: 'INTERNAL_SERVER_ERROR' },
  };
  const notFound = {
    message: 'Article with slug missing was not found.',
    path: ['article'],
    extensions: {
      code: 'INTERNAL_SERVER_ERROR',
      status: 404,
      originalError: { statusCode: 404 },
    },
  };
  const badRequest = {
    message: 'Article id or slug required.',
    path: ['article'],
    extensions: { code: 'BAD_REQUEST', originalError: { statusCode: 400 } },
  };
  const forbidden = {
    message: 'Forbidden',
    path: ['article'],
    extensions: { code: 'FORBIDDEN', originalError: { statusCode: 403 } },
  };

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ['a database timeout', poolTimeout],
    ['a 503', unavailable],
  ])(
    'throws on %s without content, so Next keeps serving the previous page instead of storing an empty one',
    (_, error) => {
      expect(() => revalidateFor(undefined, [error])).toThrow(error.message);
      expect(() => revalidateFor(null, [error])).toThrow(error.message);
    }
  );

  it('throws when a server error comes along with an unpublished article', () => {
    expect(() => revalidateFor(null, [neverPublished, poolTimeout])).toThrow(
      poolTimeout.message
    );
  });

  it.each([
    ['a never published article', neverPublished],
    ['an article whose pending version is not shown', pendingHidden],
  ])(
    'answers %s with a page that re-renders after a minute, as the preview needs that page',
    (_, error) => {
      expect(revalidateFor(null, [error])).toBe(60);
    }
  );

  it.each([
    ['not found', notFound],
    ['a bad request', badRequest],
    ['forbidden', forbidden],
  ])('does not throw on %s', (_, error) => {
    expect(revalidateFor(null, [error])).toBe(60);
  });

  it('never throws when there is content', () => {
    expect(revalidateFor(article([richText]), [poolTimeout])).toBe(60);
  });

  it('never throws while next build prerenders, so a deployment does not fail on an api hiccup', () => {
    vi.stubEnv('NEXT_PHASE', 'phase-production-build');

    expect(revalidateFor(null, [poolTimeout])).toBe(60);
  });
});
