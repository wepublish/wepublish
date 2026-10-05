import { createAuthorFilter, createHasArticlesFilter } from './author.service';

describe('createHasArticlesFilter', () => {
  const now = new Date('2026-10-12T10:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not filter when the flag is absent', () => {
    expect(createHasArticlesFilter(undefined)).toEqual({});
    expect(createHasArticlesFilter({})).toEqual({});
  });

  it('keeps only authors on a revision that is published by now', () => {
    expect(createHasArticlesFilter({ hasArticles: true })).toEqual({
      articlesAsAuthor: {
        some: {
          revision: {
            publishedAt: {
              lte: now,
            },
          },
        },
      },
    });
  });

  it('keeps only authors without a published revision when set to false', () => {
    expect(createHasArticlesFilter({ hasArticles: false })).toEqual({
      articlesAsAuthor: {
        none: {
          revision: {
            publishedAt: {
              lte: now,
            },
          },
        },
      },
    });
  });

  it('ignores revisions scheduled for the future', () => {
    const { articlesAsAuthor } = createHasArticlesFilter({
      hasArticles: true,
    }) as any;

    expect(articlesAsAuthor.some.revision.publishedAt.lte).toEqual(now);
  });

  it('is combined into the author filter', () => {
    expect(createAuthorFilter({ hasArticles: true }).AND).toContainEqual(
      createHasArticlesFilter({ hasArticles: true })
    );
  });
});
