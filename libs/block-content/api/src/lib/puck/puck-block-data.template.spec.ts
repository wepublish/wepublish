import { Logger } from '@nestjs/common';
import { limitAnswerCache } from '@wepublish/public-content-cache/api';
import type {
  ApiBlock,
  ApiBlockDatasources,
} from '@wepublish/puck-content/api';

import {
  LINKED_TEMPLATE_TYPE,
  MAX_LINKED_TEMPLATE_DEPTH,
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

const reader: PuckDocumentOptions = { pruned: true, now, preview: false };
const editor: PuckDocumentOptions = { pruned: false, now, preview: true };

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

const linked = (
  id: string,
  templateId: string,
  extra: Partial<ApiBlock> = {}
) =>
  block(id, undefined, undefined, {
    type: LINKED_TEMPLATE_TYPE,
    props: { templateId },
    ...extra,
  });

const published = (id: string) => ({ id, publishedAt: past });

type Row = {
  id: string;
  name: string;
  puckBlocks: unknown;
  puckRegistry: unknown;
};

describe('PuckBlockDataLoader linked templates', () => {
  const articleService = { getArticles: vi.fn() };
  const pageService = { getPages: vi.fn() };
  const eventService = { getEvents: vi.fn() };
  const memberPlanService = { getActiveMemberPlans: vi.fn() };
  const articles = { loadMany: vi.fn() };
  const pages = { loadMany: vi.fn() };
  const events = { loadMany: vi.fn() };
  const images = { loadMany: vi.fn() };
  const memberPlans = { loadMany: vi.fn() };
  const prisma = {
    subscription: { findMany: vi.fn() },
    blockTemplate: { findMany: vi.fn() },
  };

  let rows: Row[];
  let loader: PuckBlockDataLoader;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    rows = [];
    articleService.getArticles.mockResolvedValue({ nodes: [] });
    articles.loadMany.mockImplementation(async (keys: string[]) =>
      keys.map(key => published(key))
    );
    prisma.blockTemplate.findMany.mockImplementation(
      async ({ where }: { where: { id: { in: string[] } } }) =>
        rows.filter(({ id }) => where.id.in.includes(id))
    );

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

  const resolve = async (
    tree: ApiBlock[],
    options = reader,
    context: object = {}
  ) => {
    const flat = loader.flatten(tree, options);
    const data = await Promise.all(
      flat.map(async entry => ({
        id: entry.id,
        data: await loader.data(entry, { context }),
      }))
    );

    return Object.fromEntries(data.map(({ id, data }) => [id, data]));
  };

  it('resolves the current blocks and registry of the linked template', async () => {
    rows = [
      {
        id: 'tpl',
        name: 'Rubric',
        puckBlocks: [block('heading', undefined, [block('text')])],
        puckRegistry: { components: { Hero: { html: '<section></section>' } } },
      },
    ];

    const data = await resolve([linked('ref', 'tpl')]);
    const template = data['ref'].template;

    expect(template).toEqual(
      expect.objectContaining({
        id: 'tpl',
        name: 'Rubric',
        puckRegistry: { components: { Hero: { html: '<section></section>' } } },
      })
    );
    expect(
      template?.puckBlocks.map(({ id, parentId }) => ({ id, parentId }))
    ).toEqual([
      { id: 'ref/heading', parentId: null },
      { id: 'ref/text', parentId: 'ref/heading' },
    ]);
  });

  it('only resolves a template for linked blocks', async () => {
    const data = await resolve([block('box')]);

    expect(data['box']).not.toHaveProperty('template');
    expect(prisma.blockTemplate.findMany).not.toHaveBeenCalled();
  });

  it('resolves the datasources of the blocks inside the template', async () => {
    rows = [
      {
        id: 'tpl',
        name: 'Rubric',
        puckBlocks: [
          block('picked', { article: { type: 'single', id: 'a1' } }),
        ],
        puckRegistry: null,
      },
    ];

    const data = await resolve([linked('ref', 'tpl')]);
    const [picked] = data['ref'].template?.puckBlocks ?? [];

    expect(
      (await loader.data(picked, { context: {} })).articles?.map(({ id }) => id)
    ).toEqual(['a1']);
  });

  it('lets teasers inside the template consume the list around the linked block', async () => {
    articleService.getArticles.mockResolvedValue({
      nodes: [published('a1'), published('a2')],
    });
    rows = [
      {
        id: 'tpl',
        name: 'Teasers',
        puckBlocks: [
          block('teaser-1', { article: { type: 'slot' } }),
          block('teaser-2', { article: { type: 'slot' } }),
        ],
        puckRegistry: null,
      },
    ];

    const data = await resolve([
      block('grid', { article: { type: 'list' } }, [linked('ref', 'tpl')]),
    ]);
    const teasers = data['ref'].template?.puckBlocks ?? [];
    const yielded = await Promise.all(
      teasers.map(async teaser =>
        (await loader.data(teaser, { context: {} })).articles?.map(
          ({ id }) => id
        )
      )
    );

    expect(yielded).toEqual([['a1'], ['a2']]);
  });

  it('resolves a deleted template as empty and logs it', async () => {
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    const data = await resolve([linked('ref', 'gone')]);

    expect(data['ref'].template).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('gone'));
  });

  it('stops at a template that links itself, directly or indirectly', async () => {
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    rows = [
      {
        id: 'a',
        name: 'A',
        puckBlocks: [block('in-a'), linked('to-b', 'b')],
        puckRegistry: null,
      },
      {
        id: 'b',
        name: 'B',
        puckBlocks: [linked('back-to-a', 'a')],
        puckRegistry: null,
      },
    ];

    const data = await resolve([linked('ref', 'a')]);
    const blocks = data['ref'].template?.puckBlocks ?? [];

    expect(blocks.map(({ id }) => id)).toEqual([
      'ref/in-a',
      'ref/to-b',
      'ref/to-b/back-to-a',
    ]);

    const backToA = blocks.find(({ id }) => id === 'ref/to-b/back-to-a');

    expect((await loader.data(backToA!, { context: {} })).template).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('a'));
  });

  it('nests a linked template inside a linked template under its template slot', async () => {
    rows = [
      {
        id: 'outer',
        name: 'Outer',
        puckBlocks: [linked('inner-ref', 'inner')],
        puckRegistry: { components: { Hero: { html: 'outer' } } },
      },
      {
        id: 'inner',
        name: 'Inner',
        puckBlocks: [block('inner-text')],
        puckRegistry: { components: { Card: { html: 'inner' } } },
      },
    ];

    const data = await resolve([linked('ref', 'outer')]);
    const template = data['ref'].template;

    expect(
      template?.puckBlocks.map(({ id, parentId, puckSlot }) => ({
        id,
        parentId,
        puckSlot,
      }))
    ).toEqual([
      { id: 'ref/inner-ref', parentId: null, puckSlot: null },
      {
        id: 'ref/inner-ref/inner-text',
        parentId: 'ref/inner-ref',
        puckSlot: 'template',
      },
    ]);
    expect(template?.puckRegistry?.components).toEqual({
      Hero: { html: 'outer' },
      Card: { html: 'inner' },
    });
  });

  it('stops nesting linked templates beyond the maximum depth', async () => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    rows = Array.from(
      { length: MAX_LINKED_TEMPLATE_DEPTH + 2 },
      (_, index) => ({
        id: `t${index}`,
        name: `T${index}`,
        puckBlocks: [linked(`l${index}`, `t${index + 1}`)],
        puckRegistry: null,
      })
    );

    const data = await resolve([linked('ref', 't0')]);

    expect(data['ref'].template?.puckBlocks).toHaveLength(
      MAX_LINKED_TEMPLATE_DEPTH
    );
  });

  it('leaves out hidden blocks of the template for readers, but not for editors', async () => {
    rows = [
      {
        id: 'tpl',
        name: 'Rubric',
        puckBlocks: [
          block('shown'),
          block('hidden', undefined, undefined, {
            visibility: { disabled: true },
          }),
        ],
        puckRegistry: null,
      },
    ];

    const forReaders = await resolve([linked('ref', 'tpl')]);
    const forEditors = await resolve([linked('ref', 'tpl')], editor);

    expect(forReaders['ref'].template?.puckBlocks.map(({ id }) => id)).toEqual([
      'ref/shown',
    ]);
    expect(forEditors['ref'].template?.puckBlocks.map(({ id }) => id)).toEqual([
      'ref/shown',
      'ref/hidden',
    ]);
  });

  it('lets the answer cache expire when timed blocks of the template change', async () => {
    rows = [
      {
        id: 'tpl',
        name: 'Rubric',
        puckBlocks: [
          block('later', undefined, undefined, {
            visibility: { timings: { from: '2026-01-05T09:30:00.000Z' } },
          }),
        ],
        puckRegistry: null,
      },
    ];
    const context = {};

    await resolve([linked('ref', 'tpl')], reader, context);

    expect(limitAnswerCache).toHaveBeenCalledWith(
      context,
      new Date('2026-01-05T09:30:00Z')
    );
  });

  it('loads every template once per document', async () => {
    rows = [
      {
        id: 'tpl',
        name: 'Rubric',
        puckBlocks: [block('text')],
        puckRegistry: null,
      },
    ];

    await resolve([linked('one', 'tpl'), linked('two', 'tpl')]);

    expect(prisma.blockTemplate.findMany).toHaveBeenCalledTimes(1);
  });
});
