import { SlateToPmMigrator } from './slate-to-pm-migrator';

const TEN_SECONDS = 10_000;
const FIVE_SECONDS = 5_000;

const JOBS: Array<[keyof SlateToPmMigrator, string, number]> = [
  ['migrateAuthors', 'slate.migrateAuthors', TEN_SECONDS],
  ['migrateComments', 'slate.migrateComments', TEN_SECONDS],
  ['migrateEvents', 'slate.migrateEvents', TEN_SECONDS],
  ['migratePeerProfiles', 'slate.migratePeerProfiles', TEN_SECONDS],
  ['migratePeers', 'slate.migratePeers', TEN_SECONDS],
  ['migratePolls', 'slate.migratePolls', TEN_SECONDS],
  ['migrateTags', 'slate.migrateTags', TEN_SECONDS],
  ['migrateMemberPlans', 'slate.migrateMemberPlans', TEN_SECONDS],
  ['migratePaywalls', 'slate.migratePaywalls', TEN_SECONDS],
  ['migrateArticles', 'slate.migrateArticles', FIVE_SECONDS],
  ['migratePages', 'slate.migratePages', FIVE_SECONDS],
  ['remigrateBuggyArticles', 'slate.remigrateBuggyArticles', FIVE_SECONDS],
  ['remigrateBuggyPages', 'slate.remigrateBuggyPages', FIVE_SECONDS],
  [
    'remigrateUnmigratedArticles',
    'slate.remigrateUnmigratedArticles',
    FIVE_SECONDS,
  ],
  ['remigrateUnmigratedPages', 'slate.remigrateUnmigratedPages', FIVE_SECONDS],
  ['remigrateBuggyEntities', 'slate.remigrateBuggyEntities', FIVE_SECONDS],
];

const untouchable = new Proxy(
  {},
  {
    get: (_, property) => {
      throw new Error(`touched ${String(property)}`);
    },
  }
);

describe('SlateToPmMigrator across replicas', () => {
  const setup = (claimed: boolean | undefined) => {
    const prisma = {
      author: {
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
      },
    };
    const scheduler = { deleteCronJob: vi.fn() };
    const kv = { claim: vi.fn().mockResolvedValue(claimed) };
    const migrator = new SlateToPmMigrator(
      prisma as any,
      scheduler as any,
      kv as any
    );

    return { migrator, prisma, scheduler, kv };
  };

  it('migrates on the replica that claims the tick', async () => {
    const { migrator, prisma, scheduler } = setup(true);

    await migrator.migrateAuthors();

    expect(prisma.author.findMany).toHaveBeenCalled();
    expect(scheduler.deleteCronJob).toHaveBeenCalledWith(
      'slate.migrateAuthors'
    );
  });

  it('leaves the tick to the replica that claimed it and keeps ticking', async () => {
    const { migrator, prisma, scheduler } = setup(false);

    await migrator.migrateAuthors();

    expect(prisma.author.findMany).not.toHaveBeenCalled();
    expect(scheduler.deleteCronJob).not.toHaveBeenCalled();
  });

  it('migrates like before without Dragonfly, since unmigrated content stays broken', async () => {
    const { migrator, prisma } = setup(undefined);

    await migrator.migrateAuthors();

    expect(prisma.author.findMany).toHaveBeenCalled();
  });

  it.each(JOBS)(
    'lets only one replica run %s per tick',
    async (method, name, intervalMs) => {
      const kv = { claim: vi.fn().mockResolvedValue(false) };
      const migrator = new SlateToPmMigrator(
        untouchable as any,
        untouchable as any,
        kv as any
      );

      await (migrator[method] as () => Promise<void>).call(migrator);

      const [[claimedName, ttlMs]] = kv.claim.mock.calls;
      expect(claimedName).toBe(name);
      expect(ttlMs).toBeGreaterThan(0);
      expect(ttlMs).toBeLessThan(intervalMs);
    }
  );
});
