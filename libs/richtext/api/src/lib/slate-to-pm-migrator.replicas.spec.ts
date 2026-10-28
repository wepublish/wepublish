import {
  type ClaimResult,
  type DistributedClaims,
} from '@wepublish/dragonfly/api';
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
  [
    'normalizeNestedListsInArticles',
    'slate.normalizeNestedListsInArticles',
    FIVE_SECONDS,
  ],
  [
    'normalizeNestedListsInPages',
    'slate.normalizeNestedListsInPages',
    FIVE_SECONDS,
  ],
  [
    'normalizeNestedListsInEntities',
    'slate.normalizeNestedListsInEntities',
    FIVE_SECONDS,
  ],
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
  const setup = (claimed: ClaimResult) => {
    const prisma = {
      author: {
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
      },
    };
    const scheduler = { deleteCronJob: vi.fn() };
    const claims = {
      claim: vi.fn().mockResolvedValue(claimed),
    } satisfies Pick<DistributedClaims, 'claim'>;
    const migrator = new SlateToPmMigrator(
      prisma as any,
      scheduler as any,
      claims as unknown as DistributedClaims,
      undefined as any,
      undefined as any
    );

    return { migrator, prisma, scheduler, claims };
  };

  it('migrates on the replica that claims the tick', async () => {
    const { migrator, prisma, scheduler } = setup('claimed');

    await migrator.migrateAuthors();

    expect(prisma.author.findMany).toHaveBeenCalled();
    expect(scheduler.deleteCronJob).toHaveBeenCalledWith(
      'slate.migrateAuthors'
    );
  });

  it('leaves the tick to the replica that claimed it and keeps ticking', async () => {
    const { migrator, prisma, scheduler } = setup('taken');

    await migrator.migrateAuthors();

    expect(prisma.author.findMany).not.toHaveBeenCalled();
    expect(scheduler.deleteCronJob).not.toHaveBeenCalled();
  });

  it.each<ClaimResult>(['not-configured', 'unavailable'])(
    'migrates like before when Dragonfly cannot tell (%s), since unmigrated content stays broken',
    async claimed => {
      const { migrator, prisma } = setup(claimed);

      await migrator.migrateAuthors();

      expect(prisma.author.findMany).toHaveBeenCalled();
    }
  );

  it.each(JOBS)(
    'lets only one replica run %s per tick',
    async (method, name, intervalMs) => {
      const claims = {
        claim: vi.fn().mockResolvedValue('taken'),
      } satisfies Pick<DistributedClaims, 'claim'>;
      const migrator = new SlateToPmMigrator(
        untouchable as any,
        untouchable as any,
        claims as unknown as DistributedClaims,
        untouchable as any,
        untouchable as any
      );

      await (migrator[method] as () => Promise<void>).call(migrator);

      const [[claimedName, ttlMs]] = claims.claim.mock.calls;
      expect(claimedName).toBe(name);
      expect(ttlMs).toBeGreaterThan(0);
      expect(ttlMs).toBeLessThan(intervalMs);
    }
  );
});
