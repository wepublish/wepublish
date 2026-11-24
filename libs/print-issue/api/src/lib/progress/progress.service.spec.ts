import type { PrismaClient } from '@prisma/client';
import { PrintIssueProgressService } from './progress.service';

const NOW = new Date('2026-11-23T10:00:00.000Z');

// a running two-year subscription, worth 12 at six issues a year
const row = (
  id: string,
  userID: string,
  copies: number,
  overrides: Record<string, unknown> = {}
) => ({
  id,
  userID,
  startsAt: new Date('2026-01-01T00:00:00.000Z'),
  paidUntil: new Date('2027-12-31T00:00:00.000Z'),
  autoRenew: true,
  deactivation: null,
  memberPlan: {
    id: 'plan',
    slug: 'plan',
    name: 'Basic',
    productType: 'Subscription',
    periodicityPricing: [{ periodicity: 'biennial', printIssues: null }],
  },
  periods: [
    {
      id: `${id}-p`,
      startsAt: new Date('2026-01-01T00:00:00.000Z'),
      endsAt: new Date('2027-12-31T00:00:00.000Z'),
      paymentPeriodicity: 'biennial',
      invoiceID: `${id}-i`,
      invoice: {
        paidAt: new Date('2026-01-01T00:00:00.000Z'),
        canceledAt: null,
      },
    },
  ],
  invoices: [],
  printDeliveries: Array.from({ length: copies }, (_, i) => ({
    periodId: `${id}-p`,
    batch: i === 0 ? 1 : 0,
    issue: {
      number: 110 + i,
      numberTo: null,
      year: 2026,
      countsAs: 1,
      issueDate: new Date(`2026-0${(i % 9) + 1}-15T00:00:00.000Z`),
    },
    delivery: { deliveredAt: new Date('2026-01-10T09:00:00.000Z') },
  })),
  ...overrides,
});

const make = (rows: ReturnType<typeof row>[], users = ['u1', 'u2', 'u3']) => {
  const prisma = {
    subscription: { findMany: vi.fn(async () => rows) },
    user: { findMany: vi.fn(async () => users.map(id => ({ id }))) },
    printIssue: { findMany: vi.fn(async () => []) },
    setting: {
      findUnique: vi.fn(async ({ where }: { where: { name: string } }) =>
        where.name === 'printIssuesPerYear' ? { value: 6 }
        : where.name === 'printIssueNumbering' ? { value: 'continuous' }
        : where.name === 'printIssueLabelFormat' ? { value: '#{range}' }
        : null
      ),
    },
  };

  return {
    prisma,
    service: new PrintIssueProgressService(prisma as unknown as PrismaClient),
  };
};

describe('PrintIssueProgressService', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterAll(() => vi.useRealTimers());

  it("reads only copies handed over, labelled the medium's way", async () => {
    const { service, prisma } = make([row('s1', 'u1', 2)]);

    const progress = (await service.forSubscriptions(['s1'])).get('s1');

    expect(progress).toMatchObject({ received: 2, entitled: 12, owed: 10 });
    expect(progress!.issues.map(issue => [issue.label, issue.batch])).toEqual([
      ['#110', 1],
      ['#111', 0],
    ]);
    expect(prisma.subscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['s1'] } },
        select: expect.objectContaining({
          printDeliveries: expect.objectContaining({
            where: { delivery: { deliveredAt: { not: null } } },
          }),
        }),
      })
    );
  });

  it("groups each user's subscriptions with something to count", async () => {
    const { service } = make([
      row('s1', 'u1', 7),
      row('s2', 'u1', 1),
      row('s3', 'u2', 0, {
        memberPlan: {
          id: 'd',
          slug: 'd',
          name: 'Spende',
          productType: 'Donation',
          periodicityPricing: [],
        },
      }),
    ]);

    const byUser = await service.forUsers(['u1', 'u2']);

    expect(byUser.get('u1')!.map(p => [p.subscriptionId, p.received])).toEqual([
      ['s1', 7],
      ['s2', 1],
    ]);
    expect(byUser.get('u2')).toEqual([]);
  });

  it('ranks users by the copies still owed to them, those owed nothing next, the rest last', async () => {
    const { service, prisma } = make([
      row('s1', 'u1', 11),
      row('s2', 'u2', 2),
      row('s3', 'u2', 4),
    ]);

    // u2: 10 + 8 owed, u1: 1 owed, u3: no printed issues
    expect(await service.usersByOwed({ active: true }, 'desc')).toEqual([
      'u2',
      'u1',
      'u3',
    ]);
    expect(await service.usersByOwed({ active: true }, 'asc')).toEqual([
      'u1',
      'u2',
      'u3',
    ]);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { active: true } })
    );
  });

  it('counts only what is still to send: not what an ended subscription missed long ago', async () => {
    const endedLongAgo = row('s1', 'u1', 1, {
      paidUntil: new Date('2026-03-31T00:00:00.000Z'),
      autoRenew: false,
      deactivation: {
        date: new Date('2026-03-31T00:00:00.000Z'),
        reason: 'userSelfDeactivated',
      },
      periods: [
        {
          id: 's1-p',
          startsAt: new Date('2025-04-01T00:00:00.000Z'),
          endsAt: new Date('2026-03-31T00:00:00.000Z'),
          paymentPeriodicity: 'yearly',
          invoiceID: 's1-i',
          invoice: {
            paidAt: new Date('2025-04-01T00:00:00.000Z'),
            canceledAt: null,
          },
        },
      ],
    });
    const { service } = make([endedLongAgo, row('s2', 'u2', 11)], ['u1', 'u2']);

    expect(await service.owedByUser(['u1', 'u2'])).toEqual(
      new Map([
        ['u1', 0],
        ['u2', 1],
      ])
    );
  });
});
