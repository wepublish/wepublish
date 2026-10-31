import type { UserSession } from '@wepublish/authentication/api';
import { ArticleSort } from '@wepublish/article/api';
import { EventSort } from '@wepublish/event/api';
import { PageSort } from '@wepublish/page/api';
import {
  limitAnswerCache,
  skipAnswerCache,
} from '@wepublish/public-content-cache/api';
import type {
  ApiBlock,
  ApiBlockDatasources,
} from '@wepublish/puck-content/api';
import { SortOrder } from '@wepublish/utils/api';

import {
  PuckBlockDataLoader,
  PuckDocumentOptions,
} from './puck-block-data.loader';

vi.mock('@wepublish/public-content-cache/api', async importOriginal => ({
  ...(await importOriginal<object>()),
  limitAnswerCache: vi.fn(),
  skipAnswerCache: vi.fn(),
}));

const now = new Date('2026-01-05T09:00:00Z');
const past = new Date('2026-01-01T00:00:00Z');
const future = new Date('2026-02-01T00:00:00Z');

const block = (
  id: string,
  datasources?: ApiBlockDatasources,
  children?: ApiBlock[],
  extra: Partial<ApiBlock> = {}
): ApiBlock =>
  ({
    id,
    kind: 'puck',
    type: 'Box',
    props: {},
    ...(datasources ? { datasources } : {}),
    ...(children ? { children } : {}),
    ...extra,
  }) as ApiBlock;

const record = (id: string, extra: object = {}) => ({ id, ...extra });
const published = (id: string) => record(id, { publishedAt: past });
const ids = (records: { id: string }[] | null) =>
  records?.map(({ id }) => id) ?? null;

const reader: PuckDocumentOptions = { pruned: true, now, preview: false };
const editor: PuckDocumentOptions = { pruned: false, now, preview: true };

const byIds =
  <Entry extends { id: string }>(entries: Entry[]) =>
  async (keys: readonly string[]) =>
    keys.map(key => entries.find(({ id }) => id === key) ?? null);

const page = <Entry>(nodes: Entry[]) => ({ nodes });

describe('PuckBlockDataLoader', () => {
  const articleService = { getArticles: vi.fn() };
  const pageService = { getPages: vi.fn() };
  const eventService = { getEvents: vi.fn() };
  const memberPlanService = { getActiveMemberPlans: vi.fn() };
  const articles = { loadMany: vi.fn() };
  const pages = { loadMany: vi.fn() };
  const events = { loadMany: vi.fn() };
  const images = { loadMany: vi.fn() };
  const memberPlans = { loadMany: vi.fn() };
  const prisma = { subscription: { findMany: vi.fn() } };

  let loader: PuckBlockDataLoader;

  beforeEach(() => {
    vi.clearAllMocks();
    articleService.getArticles.mockResolvedValue(page([]));
    pageService.getPages.mockResolvedValue(page([]));
    eventService.getEvents.mockResolvedValue(page([]));
    memberPlanService.getActiveMemberPlans.mockResolvedValue([]);
    articles.loadMany.mockResolvedValue([]);
    pages.loadMany.mockResolvedValue([]);
    events.loadMany.mockResolvedValue([]);
    images.loadMany.mockResolvedValue([]);
    memberPlans.loadMany.mockResolvedValue([]);
    prisma.subscription.findMany.mockResolvedValue([]);

    loader = new PuckBlockDataLoader(
      articleService as never,
      pageService as never,
      eventService as never,
      memberPlanService as never,
      articles as never,
      pages as never,
      events as never,
      images as never,
      memberPlans as never,
      prisma as never
    );
  });

  const dataOf = async (
    tree: ApiBlock[],
    options = reader,
    request: { user?: UserSession; context: object } = { context: {} }
  ) => {
    const flat = loader.flatten(tree, options);

    return Object.fromEntries(
      await Promise.all(
        flat.map(async entry => [entry.id, await loader.data(entry, request)])
      )
    );
  };

  it('flattens the blocks as a revision reads them', () => {
    expect(
      loader
        .flatten([block('grid', undefined, [block('text')])], reader)
        .map(({ id, parentId, puckSlot, position }) => ({
          id,
          parentId,
          puckSlot,
          position,
        }))
    ).toEqual([
      { id: 'grid', parentId: null, puckSlot: null, position: 0 },
      { id: 'text', parentId: 'grid', puckSlot: 'content', position: 0 },
    ]);
  });

  it('yields nothing for a block it did not flatten', async () => {
    expect(
      await loader.data(
        { id: 'stranger', kind: 'puck', type: 'Box', props: {} } as never,
        { context: {} }
      )
    ).toEqual({
      articles: null,
      pages: null,
      events: null,
      images: null,
      memberPlans: null,
      userSubscriptions: null,
    });
  });

  it('keeps a model null when the block has no datasource for it', async () => {
    images.loadMany.mockImplementation(byIds([record('i1')]));

    expect(
      await dataOf([block('image', { image: { type: 'single', id: 'i1' } })])
    ).toEqual({
      image: {
        articles: null,
        pages: null,
        events: null,
        images: [record('i1')],
        memberPlans: null,
        userSubscriptions: null,
      },
    });
  });

  it('computes a document once, however many of its blocks ask', async () => {
    articleService.getArticles.mockResolvedValue(
      page([published('a1'), published('a2')])
    );

    await dataOf([
      block('grid', { article: { type: 'list' } }, [
        block('c1', { article: { type: 'slot' } }),
        block('c2', { article: { type: 'slot' } }),
      ]),
    ]);

    expect(articleService.getArticles).toHaveBeenCalledTimes(1);
  });

  describe('picks', () => {
    beforeEach(() => {
      articles.loadMany.mockImplementation(
        byIds([
          published('a1'),
          record('draft', { publishedAt: null }),
          record('pending', { publishedAt: future }),
          published('a2'),
        ])
      );
      pages.loadMany.mockImplementation(
        byIds([published('p1'), record('draft-page', { publishedAt: null })])
      );
    });

    const tree = [
      block('picks', {
        article: {
          type: 'multiple',
          ids: ['a2', 'draft', 'missing', 'pending', 'a1'],
        },
        page: { type: 'multiple', ids: ['draft-page', 'p1'] },
      }),
    ];

    it('keeps the stored order and only published records for readers', async () => {
      const { picks } = await dataOf(tree);

      expect(ids(picks.articles)).toEqual(['a2', 'a1']);
      expect(ids(picks.pages)).toEqual(['p1']);
    });

    it('keeps unpublished records in preview mode', async () => {
      const { picks } = await dataOf(tree, { ...reader, preview: true });

      expect(ids(picks.articles)).toEqual(['a2', 'draft', 'pending', 'a1']);
      expect(ids(picks.pages)).toEqual(['draft-page', 'p1']);
    });

    it('yields nothing for an empty pick', async () => {
      const { none } = await dataOf([
        block('none', { article: { type: 'multiple', ids: [] } }),
      ]);

      expect(none.articles).toEqual([]);
    });

    it('picks events, images and member plans whatever their state', async () => {
      events.loadMany.mockImplementation(byIds([record('e1')]));
      images.loadMany.mockImplementation(byIds([record('i1')]));
      memberPlans.loadMany.mockImplementation(
        byIds([record('m1', { active: false })])
      );

      const { mixed } = await dataOf([
        block('mixed', {
          event: { type: 'single', id: 'e1' },
          image: { type: 'single', id: 'i1' },
          memberPlan: { type: 'single', id: 'm1' },
        }),
      ]);

      expect([
        ids(mixed.events),
        ids(mixed.images),
        ids(mixed.memberPlans),
      ]).toEqual([['e1'], ['i1'], ['m1']]);
    });
  });

  describe('lists', () => {
    it('loads the latest published articles, one per slot consumer', async () => {
      articleService.getArticles.mockResolvedValue(
        page([published('a1'), published('a2')])
      );

      const data = await dataOf([
        block('grid', { article: { type: 'list' } }, [
          block('c1', { article: { type: 'slot' } }),
          block('c2', { article: { type: 'slot' } }),
        ]),
      ]);

      expect(articleService.getArticles).toHaveBeenCalledWith({
        filter: { published: true },
        sort: ArticleSort.PublishedAt,
        order: SortOrder.Descending,
        take: 2,
      });
      expect([
        ids(data.grid.articles),
        ids(data.c1.articles),
        ids(data.c2.articles),
      ]).toEqual([['a1', 'a2'], ['a1'], ['a2']]);
    });

    it('loads the records a block consumes itself, ahead of its slots', async () => {
      eventService.getEvents.mockResolvedValue(
        page([
          record('e1', { startsAt: future }),
          record('e2', { startsAt: future }),
          record('e3', { startsAt: future }),
        ])
      );

      const data = await dataOf([
        block(
          'events',
          { event: { type: 'list' } },
          [block('c1', { event: { type: 'slot' } })],
          { consumes: 2 }
        ),
      ]);

      expect(eventService.getEvents).toHaveBeenCalledWith({
        filter: { upcomingOnly: true },
        sort: EventSort.StartsAt,
        order: SortOrder.Ascending,
        take: 3,
      });
      expect([ids(data.events.events), ids(data.c1.events)]).toEqual([
        ['e1', 'e2'],
        ['e3'],
      ]);
    });

    it('asks for nothing when a list has no consumers', async () => {
      const { events: list } = await dataOf([
        block('events', { event: { type: 'list' } }),
      ]);

      expect(list.events).toEqual([]);
      expect(eventService.getEvents).not.toHaveBeenCalled();
    });

    it('excludes the picks and the earlier shown lists from a unique list', async () => {
      articleService.getArticles
        .mockResolvedValueOnce(page([published('a1')]))
        .mockResolvedValueOnce(page([published('a3')]));

      await dataOf(
        [
          block('top', { article: { type: 'list' } }, [
            block('t1', { article: { type: 'slot' } }),
            block('t2', { article: { type: 'slot' } }, undefined, {
              visibility: { disabled: true },
            }),
          ]),
          block('unique', { article: { type: 'uniqueList' } }, [
            block('u1', { article: { type: 'slot' } }),
          ]),
          block('pick', { article: { type: 'single', id: 'a9' } }),
        ],
        editor
      );

      expect(articleService.getArticles).toHaveBeenNthCalledWith(2, {
        filter: { published: true, excludeIds: ['a9', 'a1'] },
        sort: ArticleSort.PublishedAt,
        order: SortOrder.Descending,
        take: 1,
      });
    });

    it('over-fetches pages to leave the excluded ones out', async () => {
      pageService.getPages.mockResolvedValue(
        page([published('p9'), published('p1'), published('p2')])
      );

      const data = await dataOf([
        block('pick', { page: { type: 'single', id: 'p9' } }),
        block('grid', { page: { type: 'uniqueList' } }, [
          block('c1', { page: { type: 'slot' } }),
        ]),
      ]);

      expect(pageService.getPages).toHaveBeenCalledWith({
        filter: { published: true },
        sort: PageSort.PublishedAt,
        order: SortOrder.Descending,
        take: 2,
      });
      expect(ids(data.grid.pages)).toEqual(['p1']);
    });

    it('loads upcoming events and expires the answer when the first one ends', async () => {
      eventService.getEvents.mockResolvedValue(
        page([
          record('e9', { startsAt: past, endsAt: future }),
          record('e1', {
            startsAt: new Date('2026-01-05T10:00:00Z'),
            endsAt: new Date('2026-01-05T12:00:00Z'),
          }),
          record('e2', { startsAt: new Date('2026-01-05T11:00:00Z') }),
        ])
      );
      const context = {};

      const data = await dataOf(
        [
          block('pick', { event: { type: 'single', id: 'e9' } }),
          block('grid', { event: { type: 'uniqueList' } }, [
            block('c1', { event: { type: 'slot' } }),
            block('c2', { event: { type: 'slot' } }),
          ]),
        ],
        reader,
        { context }
      );

      expect(eventService.getEvents).toHaveBeenCalledWith({
        filter: { upcomingOnly: true },
        sort: EventSort.StartsAt,
        order: SortOrder.Ascending,
        take: 3,
      });
      expect(ids(data.grid.events)).toEqual(['e1', 'e2']);
      expect(limitAnswerCache).toHaveBeenCalledWith(
        context,
        new Date('2026-01-05T11:00:00Z')
      );
    });

    it('leaves the answer cache alone for an empty event list', async () => {
      await dataOf([
        block('grid', { event: { type: 'list' } }, [
          block('c1', { event: { type: 'slot' } }),
        ]),
      ]);

      expect(limitAnswerCache).not.toHaveBeenCalled();
    });

    it('loads every active member plan', async () => {
      memberPlanService.getActiveMemberPlans.mockResolvedValue([
        record('m1'),
        record('m2'),
      ]);

      const { subscribe } = await dataOf([
        block('subscribe', { memberPlan: { type: 'list' } }, undefined, {
          consumes: 1,
        }),
      ]);

      expect(ids(subscribe.memberPlans)).toEqual(['m1', 'm2']);
    });
  });

  describe('subscriptions of the reader', () => {
    const tree = [block('mine', { userSubscription: { type: 'list' } })];

    it('loads the subscriptions of a logged in reader and never caches them', async () => {
      prisma.subscription.findMany.mockResolvedValue([record('s1')]);
      const context = {};

      const { mine } = await dataOf(tree, reader, {
        user: { user: { id: 'u1' } } as UserSession,
        context,
      });

      expect(prisma.subscription.findMany).toHaveBeenCalledWith({
        where: { userID: 'u1' },
      });
      expect(ids(mine.userSubscriptions)).toEqual(['s1']);
      expect(skipAnswerCache).toHaveBeenCalledWith(context);
    });

    it('yields none for an anonymous reader, uncached all the same', async () => {
      const context = {};

      const { mine } = await dataOf(tree, reader, { context });

      expect(mine.userSubscriptions).toEqual([]);
      expect(prisma.subscription.findMany).not.toHaveBeenCalled();
      expect(skipAnswerCache).toHaveBeenCalledWith(context);
    });
  });

  describe('answer cache', () => {
    it('never caches a preview', async () => {
      const context = {};

      await dataOf([block('a')], editor, { context });

      expect(skipAnswerCache).toHaveBeenCalledWith(context);
    });

    it('leaves a published read cacheable', async () => {
      await dataOf([block('a', { article: { type: 'list' } })]);

      expect(skipAnswerCache).not.toHaveBeenCalled();
    });
  });
});
