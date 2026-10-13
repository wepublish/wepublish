import { SlateToPmMigrator } from './slate-to-pm-migrator';

const text = (value: string) => ({ type: 'text', text: value });
const paragraph = (value: string) => ({
  type: 'paragraph',
  content: [text(value)],
});
const listItem = (...content: unknown[]) => ({ type: 'listItem', content });
const bulletList = (...content: unknown[]) => ({ type: 'bulletList', content });
const doc = (...content: unknown[]) => ({ type: 'doc', content });

// `listItem > listItem`, as the slate migration wrote nested slate list-items
const nestedDoc = doc(
  bulletList(listItem(paragraph('parent'), listItem(paragraph('child'))))
);
const fixedDoc = doc(
  bulletList(
    listItem(paragraph('parent'), bulletList(listItem(paragraph('child'))))
  )
);

const setup = (raw: (sql: string) => Promise<unknown[]>) => {
  const prisma = {
    $queryRawUnsafe: vi.fn(raw),
    $executeRawUnsafe: vi.fn().mockResolvedValue(1),
  };
  const scheduler = { deleteCronJob: vi.fn() };
  const kv = {
    claim: vi.fn().mockResolvedValue(true),
    resetNamespace: vi.fn().mockResolvedValue(undefined),
  };
  const publicContentCache = {
    invalidate: vi.fn().mockResolvedValue(undefined),
    invalidateComments: vi.fn().mockResolvedValue(undefined),
    invalidateArticleLayout: vi.fn().mockResolvedValue(undefined),
  };
  const migrator = new SlateToPmMigrator(
    prisma as any,
    scheduler as any,
    kv as any,
    publicContentCache as any
  );

  const written = () =>
    prisma.$executeRawUnsafe.mock.calls.map(([sql, json, id]) => ({
      sql: sql as string,
      value: JSON.parse(json as string),
      id,
    }));

  return { migrator, prisma, scheduler, publicContentCache, written };
};

const REVISION_JOBS = [
  [
    'normalizeNestedListsInArticles',
    'slate.normalizeNestedListsInArticles',
    'articles.revisions',
  ],
  [
    'normalizeNestedListsInPages',
    'slate.normalizeNestedListsInPages',
    'pages.revisions',
  ],
] as const;

describe('SlateToPmMigrator nested list repair', () => {
  describe.each(REVISION_JOBS)('%s', (method, cronName, table) => {
    it('selects only revisions containing a listItem inside a listItem', async () => {
      const { migrator, prisma } = setup(async () => []);

      await migrator[method]();

      const [[sql, predicate]] = prisma.$queryRawUnsafe.mock
        .calls as unknown as [string, string][];
      expect(sql).toContain(`FROM "${table}"`);
      expect(predicate).toBe(
        '$.** ? (@.type == "listItem" && @.content[*].type == "listItem")'
      );
    });

    it('repairs richtext in place, wherever it sits in the blocks', async () => {
      const blocks = [
        { type: 'title', title: 'Redaktionsstatut' },
        { type: 'richText', richText: nestedDoc, slateRichText: [] },
        {
          type: 'flexBlock',
          blocks: [
            { alignment: {}, block: { type: 'richText', richText: nestedDoc } },
          ],
        },
        { type: 'listicle', items: [{ title: 'Item', richText: nestedDoc }] },
      ];
      const { migrator, written } = setup(async () => [
        { id: 'revision-1', blocks },
      ]);

      await migrator[method]();

      expect(written()).toEqual([
        {
          sql: `UPDATE "${table}" SET blocks = $1::jsonb WHERE id = $2`,
          id: 'revision-1',
          value: [
            blocks[0],
            { type: 'richText', richText: fixedDoc, slateRichText: [] },
            {
              type: 'flexBlock',
              blocks: [
                {
                  alignment: {},
                  block: { type: 'richText', richText: fixedDoc },
                },
              ],
            },
            {
              type: 'listicle',
              items: [{ title: 'Item', richText: fixedDoc }],
            },
          ],
        },
      ]);
    });

    it('stops itself once no revision is left', async () => {
      const { migrator, scheduler } = setup(async () => []);

      await migrator[method]();

      expect(scheduler.deleteCronJob).toHaveBeenCalledWith(cronName);
    });

    it('stops itself when a batch changes nothing, instead of looping', async () => {
      const { migrator, prisma, scheduler } = setup(async () => [
        {
          id: 'revision-1',
          blocks: [{ type: 'richText', richText: fixedDoc }],
        },
      ]);

      await migrator[method]();

      expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
      expect(scheduler.deleteCronJob).toHaveBeenCalledWith(cronName);
    });
  });

  it('retires the article caches after repairing an article', async () => {
    const { migrator, publicContentCache } = setup(async () => [
      { id: 'revision-1', blocks: [{ type: 'richText', richText: nestedDoc }] },
    ]);

    await migrator.normalizeNestedListsInArticles();

    expect(publicContentCache.invalidate).toHaveBeenCalledWith('articles');
    expect(publicContentCache.invalidateArticleLayout).toHaveBeenCalled();
  });

  describe('normalizeNestedListsInEntities', () => {
    const nestedIn =
      (...columns: string[]) =>
      async (sql: string) =>
        columns.some(column => sql.includes(column)) ?
          [{ id: 'row-1', value: nestedDoc }]
        : [];

    it('repairs every richtext column, without needing a slate source', async () => {
      const { migrator, prisma, written } = setup(
        nestedIn('FROM "authors"', '"description" AS value FROM "gates"')
      );

      await migrator.normalizeNestedListsInEntities();

      const queries = prisma.$queryRawUnsafe.mock.calls.map(
        ([sql]) => sql as string
      );
      expect(queries).toHaveLength(13);
      queries.forEach(sql => expect(sql).not.toContain('slate'));
      expect(written()).toEqual([
        {
          sql: 'UPDATE "authors" SET "bio" = $1::jsonb WHERE id = $2',
          id: 'row-1',
          value: fixedDoc,
        },
        {
          sql: 'UPDATE "gates" SET "description" = $1::jsonb WHERE id = $2',
          id: 'row-1',
          value: fixedDoc,
        },
      ]);
    });

    it('retires the caches of the tables it repaired', async () => {
      const { migrator, publicContentCache } = setup(nestedIn('FROM "tags"'));

      await migrator.normalizeNestedListsInEntities();

      expect(publicContentCache.invalidate).toHaveBeenCalledWith('articles');
    });

    it('stops itself once no entity is left', async () => {
      const { migrator, scheduler } = setup(async () => []);

      await migrator.normalizeNestedListsInEntities();

      expect(scheduler.deleteCronJob).toHaveBeenCalledWith(
        'slate.normalizeNestedListsInEntities'
      );
    });

    it('stops itself when a batch changes nothing', async () => {
      const { migrator, prisma, scheduler } = setup(async sql =>
        sql.includes('FROM "tags"') ? [{ id: 'row-1', value: fixedDoc }] : []
      );

      await migrator.normalizeNestedListsInEntities();

      expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
      expect(scheduler.deleteCronJob).toHaveBeenCalledWith(
        'slate.normalizeNestedListsInEntities'
      );
    });
  });
});
