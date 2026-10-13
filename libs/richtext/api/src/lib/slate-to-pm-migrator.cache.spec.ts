import { SlateToPmMigrator } from './slate-to-pm-migrator';

type Reset = [string, ...unknown[]];

const slate = [{ type: 'paragraph', children: [{ text: 'Hi' }] }];
const buggyDoc = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text' }] }],
};

const setup = ({
  rows = [] as unknown[],
  raw = async (_sql: string): Promise<unknown[]> => [],
} = {}) => {
  const model = () => ({
    findMany: vi.fn().mockResolvedValue(rows),
    update: vi.fn().mockResolvedValue({}),
  });
  const prisma = {
    author: model(),
    commentsRevisions: model(),
    event: model(),
    peerProfile: model(),
    peer: model(),
    poll: model(),
    tag: model(),
    memberPlan: model(),
    paywall: model(),
    articleRevision: model(),
    pageRevision: model(),
    $queryRaw: vi.fn().mockResolvedValue(rows),
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

  const resets = (): Reset[] => [
    ...publicContentCache.invalidate.mock.calls.map(
      (args): Reset => ['invalidate', ...args]
    ),
    ...publicContentCache.invalidateComments.mock.calls.map(
      (args): Reset => ['invalidateComments', ...args]
    ),
    ...publicContentCache.invalidateArticleLayout.mock.calls.map(
      (args): Reset => ['invalidateArticleLayout', ...args]
    ),
    ...kv.resetNamespace.mock.calls.map(
      (args): Reset => ['resetNamespace', ...args]
    ),
  ];

  return { migrator, prisma, resets };
};

const ARTICLES: Reset[] = [
  ['invalidate', 'articles'],
  ['invalidateArticleLayout'],
];
const PAGES: Reset[] = [['invalidate', 'pages']];

const MIGRATIONS: Array<[keyof SlateToPmMigrator, Reset[]]> = [
  ['migrateAuthors', [['invalidate', 'authors']]],
  ['migrateComments', [['invalidateComments', true]]],
  ['migrateEvents', [['invalidate']]],
  ['migratePeerProfiles', [['resetNamespace', 'peer-profile']]],
  ['migratePeers', [['resetNamespace', 'peering:remote-profiles']]],
  ['migratePolls', [['invalidate', 'polls']]],
  ['migrateTags', [['invalidate', 'articles']]],
  [
    'migrateMemberPlans',
    [
      ['invalidate', 'paywalls'],
      ['resetNamespace', 'member-plans'],
    ],
  ],
  ['migratePaywalls', [['invalidate', 'paywalls']]],
  ['migrateArticles', ARTICLES],
  ['migratePages', PAGES],
];

const run = (migrator: SlateToPmMigrator, method: keyof SlateToPmMigrator) =>
  (migrator[method] as () => Promise<void>).call(migrator);

describe('SlateToPmMigrator caches', () => {
  it.each(MIGRATIONS)(
    'retires the caches showing the content once after %s rewrote rows',
    async (method, expected) => {
      const { migrator, resets } = setup({
        rows: [
          { id: 'row-1', blocks: [] },
          { id: 'row-2', blocks: [] },
        ],
      });

      await run(migrator, method);

      expect(resets()).toEqual(expected);
    }
  );

  it.each(MIGRATIONS)(
    'leaves every cache alone when %s found nothing to migrate',
    async method => {
      const { migrator, resets } = setup();

      await run(migrator, method);

      expect(resets()).toEqual([]);
    }
  );

  describe('re-migrations of revisions', () => {
    const buggyRevision = {
      id: 'revision-1',
      blocks: [{ type: 'richText', richText: buggyDoc, slateRichText: slate }],
    };
    const cleanRevision = {
      id: 'revision-2',
      blocks: [{ type: 'title', title: 'Clean' }],
    };

    it.each<[keyof SlateToPmMigrator, Reset[]]>([
      ['remigrateBuggyArticles', ARTICLES],
      ['remigrateUnmigratedArticles', ARTICLES],
      ['remigrateBuggyPages', PAGES],
      ['remigrateUnmigratedPages', PAGES],
    ])(
      'retires the caches after %s rewrote a revision',
      async (method, expected) => {
        const { migrator, prisma, resets } = setup({
          raw: async () => [buggyRevision, cleanRevision],
        });

        await run(migrator, method);

        expect(prisma.$executeRawUnsafe).toHaveBeenCalledTimes(1);
        expect(resets()).toEqual(expected);
      }
    );

    it.each<keyof SlateToPmMigrator>([
      'remigrateBuggyArticles',
      'remigrateUnmigratedArticles',
      'remigrateBuggyPages',
      'remigrateUnmigratedPages',
    ])('leaves every cache alone when %s changed no revision', async method => {
      const { migrator, prisma, resets } = setup({
        raw: async () => [cleanRevision],
      });

      await run(migrator, method);

      expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
      expect(resets()).toEqual([]);
    });
  });

  describe('re-migration of entities', () => {
    const buggyEntityIn =
      (...tables: string[]) =>
      async (sql: string) =>
        tables.some(table => sql.includes(`FROM "${table}"`)) ?
          [{ id: 'row-1', src: slate, tgt: buggyDoc }]
        : [];

    it('retires only the caches of the tables it rewrote, once each', async () => {
      const { migrator, prisma, resets } = setup({
        raw: buggyEntityIn('authors', 'member.plans', 'paywalls'),
      });

      await migrator.remigrateBuggyEntities();

      expect(prisma.$executeRawUnsafe).toHaveBeenCalledTimes(7);
      expect(resets()).toEqual([
        ['invalidate', 'authors'],
        ['invalidate', 'paywalls'],
        ['invalidate', 'paywalls'],
        ['resetNamespace', 'member-plans'],
      ]);
    });

    it.each<[string, Reset[]]>([
      ['comments.revisions', [['invalidateComments', true]]],
      ['events', [['invalidate']]],
      ['peerProfiles', [['resetNamespace', 'peer-profile']]],
      ['peers', [['resetNamespace', 'peering:remote-profiles']]],
      ['polls', [['invalidate', 'polls']]],
      ['tags', [['invalidate', 'articles']]],
    ])(
      'retires the caches showing %s after rewriting it',
      async (table, expected) => {
        const { migrator, resets } = setup({ raw: buggyEntityIn(table) });

        await migrator.remigrateBuggyEntities();

        expect(resets()).toEqual(expected);
      }
    );

    it('leaves every cache alone when no entity changed', async () => {
      const { migrator, resets } = setup({
        raw: async () => [
          {
            id: 'row-1',
            src: slate,
            tgt: new SlateToPmMigrator(
              undefined as any,
              undefined as any,
              undefined as any,
              undefined as any
            ).migrate(slate),
          },
        ],
      });

      await migrator.remigrateBuggyEntities();

      expect(resets()).toEqual([]);
    });
  });
});
