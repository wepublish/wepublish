import type { Mock } from 'vitest';
import { skipAnswerCache } from '@wepublish/kv-ttl-cache/api';
import { TeaserListBlockResolver } from './teaser-list.resolver';
import { TeaserListBlock, TeaserListBlockSort } from './teaser-list.model';
import { TeaserType } from './teaser.model';

vi.mock('@wepublish/kv-ttl-cache/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/kv-ttl-cache/api')>()),
  skipAnswerCache: vi.fn(),
}));

describe('TeaserListBlockResolver most read articles', () => {
  const parent = {
    teaserType: TeaserType.Article,
    sort: TeaserListBlockSort.HotAndTrending,
    skip: 0,
    take: 3,
    filter: {},
  } as unknown as TeaserListBlock;
  const context = { req: {} };

  const resolverWith = (getMostViewedArticles: Mock) =>
    new TeaserListBlockResolver({} as never, {} as never, {} as never, {
      getMostViewedArticles,
    });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows no teasers when the lookup failed and keeps that answer out of the anonymous answer cache', async () => {
    const resolver = resolverWith(
      vi.fn().mockRejectedValue(new Error('GA4 unavailable'))
    );

    await expect(resolver.teasers(parent, context)).resolves.toEqual([]);

    expect(skipAnswerCache).toHaveBeenCalledWith(context);
  });

  it('lets the answer be cached when the lookup worked', async () => {
    const resolver = resolverWith(
      vi.fn().mockResolvedValue([{ id: 'article-1' }])
    );

    await expect(resolver.teasers(parent, context)).resolves.toEqual([
      expect.objectContaining({
        articleID: 'article-1',
        type: TeaserType.Article,
      }),
    ]);

    expect(skipAnswerCache).not.toHaveBeenCalled();
  });
});

describe('TeaserListBlockResolver events', () => {
  it('fills event teasers from the public events with the given tags', async () => {
    const getPublicEvents = vi.fn().mockResolvedValue({
      nodes: [{ id: 'event-1' }],
    });
    const resolver = new TeaserListBlockResolver(
      { getPublicEvents } as never,
      {} as never,
      {} as never,
      {} as never
    );

    await expect(
      resolver.teasers(
        {
          teaserType: TeaserType.Event,
          sort: TeaserListBlockSort.PublishedAt,
          skip: 0,
          take: 3,
          filter: { tags: ['tag-1'] },
        } as unknown as TeaserListBlock,
        { req: {} }
      )
    ).resolves.toEqual([
      expect.objectContaining({ eventID: 'event-1', type: TeaserType.Event }),
    ]);
    expect(getPublicEvents).toHaveBeenCalledWith(
      expect.objectContaining({ filter: { tagIds: ['tag-1'] }, take: 3 })
    );
  });
});
