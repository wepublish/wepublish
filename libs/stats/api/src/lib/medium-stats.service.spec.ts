import { PrismaClient } from '@prisma/client';
import { DashboardInvoiceService } from '@wepublish/membership/api';
import {
  DEFAULT_WINDOW_DAYS,
  MediumStatsService,
  resolveWindow,
  sumInvoiceAmounts,
} from './medium-stats.service';

describe('resolveWindow', () => {
  const now = new Date('2026-09-16T12:00:00.000Z');

  it('defaults to the last 30 days ending now', () => {
    const w = resolveWindow(undefined, undefined, now);

    expect(w.to).toBe(now);
    expect(w.from.toISOString()).toBe('2026-08-17T12:00:00.000Z');
    expect(DEFAULT_WINDOW_DAYS).toBe(30);
  });

  it('honours an explicit window', () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    const to = new Date('2026-02-01T00:00:00.000Z');

    expect(resolveWindow(from, to, now)).toEqual({ from, to });
  });

  it('defaults the start 30 days before an explicit end', () => {
    const to = new Date('2026-03-31T00:00:00.000Z');

    expect(resolveWindow(undefined, to, now).from.toISOString()).toBe(
      '2026-03-01T00:00:00.000Z'
    );
  });

  it('rejects a window that runs backwards', () => {
    const from = new Date('2026-05-01T00:00:00.000Z');
    const to = new Date('2026-04-01T00:00:00.000Z');

    expect(() => resolveWindow(from, to, now)).toThrow(/must not be after/i);
  });
});

describe('sumInvoiceAmounts', () => {
  it('is zero for no invoices', () => {
    expect(sumInvoiceAmounts([])).toBe(0);
  });

  it('adds the amounts', () => {
    expect(sumInvoiceAmounts([{ amount: 1200 }, { amount: 350 }])).toBe(1550);
  });
});

type PrismaStub = {
  payment: { findMany: jest.Mock };
  invoiceItem: { findMany: jest.Mock };
  invoice: { findFirst: jest.Mock };
  userRole: { findFirst: jest.Mock };
  user: { count: jest.Mock };
  mailSendJob: { aggregate: jest.Mock; findFirst: jest.Mock };
  mailchimpSyncError: { count: jest.Mock };
  page: { count: jest.Mock };
  pageRevision: { count: jest.Mock };
  session: { count: jest.Mock; findMany: jest.Mock };
  peer: { count: jest.Mock };
  settingMailProvider: { count: jest.Mock };
  settingPaymentProvider: { count: jest.Mock };
  settingSyncProvider: { count: jest.Mock };
  settingAnalyticsProvider: { count: jest.Mock };
  mailLog: { count: jest.Mock };
  periodicJob: { findFirst: jest.Mock };
  image: { aggregate: jest.Mock };
  document: { aggregate: jest.Mock };
  subscription: { count: jest.Mock };
  subscriptionDeactivation: { groupBy: jest.Mock };
  article: { count: jest.Mock };
  articleRevision: { findFirst: jest.Mock; count: jest.Mock };
  author: { count: jest.Mock };
  comment: { count: jest.Mock };
  poll: { count: jest.Mock };
  pollVote: { count: jest.Mock };
};

function makePrisma(): PrismaStub {
  return {
    payment: { findMany: jest.fn().mockResolvedValue([]) },
    invoiceItem: { findMany: jest.fn().mockResolvedValue([]) },
    userRole: { findFirst: jest.fn().mockResolvedValue(null) },
    user: { count: jest.fn().mockResolvedValue(0) },
    mailSendJob: {
      aggregate: jest
        .fn()
        .mockResolvedValue({ _sum: { sentCount: null, failedCount: null } }),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    mailLog: { count: jest.fn().mockResolvedValue(0) },
    periodicJob: { findFirst: jest.fn().mockResolvedValue(null) },
    image: {
      aggregate: jest
        .fn()
        .mockResolvedValue({ _count: { _all: 0 }, _sum: { fileSize: null } }),
    },
    document: {
      aggregate: jest
        .fn()
        .mockResolvedValue({ _count: { _all: 0 }, _sum: { fileSize: null } }),
    },
    invoice: { findFirst: jest.fn().mockResolvedValue(null) },
    subscription: { count: jest.fn().mockResolvedValue(0) },
    subscriptionDeactivation: { groupBy: jest.fn().mockResolvedValue([]) },
    article: { count: jest.fn().mockResolvedValue(0) },
    articleRevision: {
      findFirst: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
    },
    author: { count: jest.fn().mockResolvedValue(0) },
    comment: { count: jest.fn().mockResolvedValue(0) },
    poll: { count: jest.fn().mockResolvedValue(0) },
    pollVote: { count: jest.fn().mockResolvedValue(0) },
    mailchimpSyncError: { count: jest.fn().mockResolvedValue(0) },
    page: { count: jest.fn().mockResolvedValue(0) },
    pageRevision: { count: jest.fn().mockResolvedValue(0) },
    session: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    peer: { count: jest.fn().mockResolvedValue(0) },
    settingMailProvider: { count: jest.fn().mockResolvedValue(0) },
    settingPaymentProvider: { count: jest.fn().mockResolvedValue(0) },
    settingSyncProvider: { count: jest.fn().mockResolvedValue(0) },
    settingAnalyticsProvider: { count: jest.fn().mockResolvedValue(0) },
  };
}

function makeService(prisma: PrismaStub): MediumStatsService {
  const dashboardInvoice = {
    revenue: jest.fn().mockResolvedValue([]),
    expectedRevenue: jest.fn().mockResolvedValue([]),
  } as unknown as DashboardInvoiceService;

  return new MediumStatsService(
    prisma as unknown as PrismaClient,
    dashboardInvoice
  );
}

describe('MediumStatsService money at risk', () => {
  it('is zero when no payment failed', async () => {
    const prisma = makePrisma();
    const service = makeService(prisma);

    const stats = await service.getMediumStats({
      now: new Date('2026-09-16T12:00:00.000Z'),
    });

    expect(stats.money.atRisk).toBe(0);
    expect(prisma.invoiceItem.findMany).not.toHaveBeenCalled();
  });

  it('multiplies quantity by amount across the failed invoices', async () => {
    const prisma = makePrisma();
    prisma.payment.findMany.mockResolvedValue([
      { invoiceID: 'inv-1' },
      { invoiceID: 'inv-2' },
    ]);
    prisma.invoiceItem.findMany.mockResolvedValue([
      { quantity: 2, amount: 1000 },
      { quantity: 1, amount: 500 },
    ]);

    const stats = await makeService(prisma).getMediumStats();

    expect(stats.money.atRisk).toBe(2500);
  });

  it('asks for each failed invoice only once', async () => {
    const prisma = makePrisma();
    prisma.payment.findMany.mockResolvedValue([
      { invoiceID: 'inv-1' },
      { invoiceID: 'inv-1' },
      { invoiceID: 'inv-2' },
    ]);

    await makeService(prisma).getMediumStats();

    expect(prisma.invoiceItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { invoiceId: { in: ['inv-1', 'inv-2'] } },
      })
    );
  });
});

describe('MediumStatsService accounts', () => {
  it('reports no admins when the Admin role does not exist', async () => {
    const prisma = makePrisma();
    prisma.user.count.mockResolvedValue(7);

    const stats = await makeService(prisma).getMediumStats();

    expect(stats.accounts.adminCount).toBe(0);
    expect(stats.accounts.usersTotal).toBe(7);
  });

  it('counts users holding the Admin role id', async () => {
    const prisma = makePrisma();
    prisma.userRole.findFirst.mockResolvedValue({ id: 'role-admin' });
    prisma.user.count.mockResolvedValue(3);

    await makeService(prisma).getMediumStats();

    expect(prisma.user.count).toHaveBeenCalledWith({
      where: { roleIDs: { has: 'role-admin' } },
    });
  });
});

describe('MediumStatsService null tolerance', () => {
  it('turns absent aggregates into zeroes rather than null', async () => {
    const stats = await makeService(makePrisma()).getMediumStats();

    expect(stats.mail.sends).toBe(0);
    expect(stats.mail.failures).toBe(0);
    expect(stats.operations.storageBytes).toBe(0);
    expect(stats.operations.imageCount).toBe(0);
  });

  it('counts every mail, not just the campaign ones', async () => {
    // Measured on a real medium: 1023 invoices and dunning mails in thirty days
    // and not a single newsletter. The campaign sum said 0, which read as "no
    // mail went out" — so the individual mails are counted in their own right.
    const prisma = makePrisma();

    prisma.mailLog.count.mockResolvedValue(1023);

    const stats = await makeService(prisma).getMediumStats();

    expect(stats.mail.total).toBe(1023);
    expect(stats.mail.sends).toBe(0);
  });

  it('reports a medium with no periodic job as not failing', async () => {
    const stats = await makeService(makePrisma()).getMediumStats();

    expect(stats.operations.periodicJobFailing).toBe(false);
    expect(stats.operations.lastPeriodicJobAt).toBeNull();
    expect(stats.operations.periodicJobTries).toBe(0);
  });

  it('does not call a run that succeeded on retry a failure', async () => {
    // The editor dashboard grades this as a warning, not an error
    // (`getSeverity`: finishedWithError + successfullyFinished). Reporting it
    // as failing turned every recovered night into a red medium in One.
    const prisma = makePrisma();
    prisma.periodicJob.findFirst.mockResolvedValue({
      executionTime: new Date('2026-09-21T02:00:00.000Z'),
      finishedWithError: new Date('2026-09-21T02:05:00.000Z'),
      successfullyFinished: new Date('2026-09-21T02:10:00.000Z'),
      tries: 3,
      error: 'timeout',
    });

    const stats = await makeService(prisma).getMediumStats();

    expect(stats.operations.periodicJobFailing).toBe(false);
    expect(stats.operations.periodicJobTries).toBe(3);
  });

  it('still calls a run that never got through a failure', async () => {
    const prisma = makePrisma();
    prisma.periodicJob.findFirst.mockResolvedValue({
      executionTime: new Date('2026-09-21T02:00:00.000Z'),
      finishedWithError: new Date('2026-09-21T02:05:00.000Z'),
      successfullyFinished: null,
      tries: 3,
      error: 'timeout',
    });

    const stats = await makeService(prisma).getMediumStats();

    expect(stats.operations.periodicJobFailing).toBe(true);
  });

  it('reports the last run that EXECUTED, not the newest row', async () => {
    // A row that was scheduled and never ran would otherwise report "no job
    // has ever run" and hide the very case where the job got stuck.
    const prisma = makePrisma();
    const executed = new Date('2026-09-19T02:00:00.000Z');
    prisma.periodicJob.findFirst
      .mockResolvedValueOnce({
        executionTime: null,
        finishedWithError: null,
        successfullyFinished: null,
        tries: 0,
        error: null,
      })
      .mockResolvedValueOnce({
        executionTime: executed,
        finishedWithError: null,
        successfullyFinished: executed,
        tries: 1,
        error: null,
      });

    const stats = await makeService(prisma).getMediumStats();

    expect(stats.operations.lastPeriodicJobAt).toEqual(executed);
  });

  it('stamps the schema version and generation time', async () => {
    const now = new Date('2026-09-16T12:00:00.000Z');
    const stats = await makeService(makePrisma()).getMediumStats({ now });

    expect(stats.schemaVersion).toBe(1);
    expect(stats.generatedAt).toBe(now);
    expect(stats.window.to).toBe(now);
  });
});

describe('MediumStatsService new groups', () => {
  it('counts distinct users who logged in, not raw sessions', async () => {
    const prisma = makePrisma();
    prisma.session.findMany.mockResolvedValue([
      { userID: 'u1' },
      { userID: 'u2' },
    ]);
    prisma.session.count.mockResolvedValue(9);

    const stats = await makeService(prisma).getMediumStats();

    expect(stats.accounts.usersLoggedIn).toBe(2);
    expect(stats.accounts.activeSessions).toBe(9);
    expect(prisma.session.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ distinct: ['userID'] })
    );
  });

  it('reports the peering graph including disabled peers', async () => {
    const prisma = makePrisma();
    prisma.peer.count.mockResolvedValueOnce(7).mockResolvedValueOnce(2);

    const stats = await makeService(prisma).getMediumStats();

    expect(stats.network).toEqual({ peersTotal: 7, peersDisabled: 2 });
  });

  it('reports a medium with no configured providers as all zero', async () => {
    const stats = await makeService(makePrisma()).getMediumStats();

    expect(stats.integrations).toEqual({
      mailProviders: 0,
      paymentProviders: 0,
      syncProviders: 0,
      analyticsProviders: 0,
    });
  });

  it('counts mailchimp sync errors', async () => {
    const prisma = makePrisma();
    prisma.mailchimpSyncError.count.mockResolvedValue(14);

    const stats = await makeService(prisma).getMediumStats();

    expect(stats.operations.mailchimpSyncErrors).toBe(14);
  });

  it('counts pages and revisions alongside articles', async () => {
    const prisma = makePrisma();
    prisma.page.count.mockResolvedValueOnce(12).mockResolvedValueOnce(3);
    prisma.articleRevision.count = jest.fn().mockResolvedValue(500);
    prisma.pageRevision.count.mockResolvedValue(60);

    const stats = await makeService(prisma).getMediumStats();

    expect(stats.editorial.pagesCount).toBe(12);
    expect(stats.editorial.pagesPublished).toBe(3);
    expect(stats.editorial.articleRevisionsCount).toBe(500);
    expect(stats.editorial.pageRevisionsCount).toBe(60);
  });
});

describe('MediumStatsService storage', () => {
  it('reports images and documents separately and as a sum', async () => {
    const prisma = makePrisma();
    prisma.image.aggregate.mockResolvedValue({
      _count: { _all: 12 },
      _sum: { fileSize: 3000 },
    });
    prisma.document.aggregate.mockResolvedValue({
      _count: { _all: 4 },
      _sum: { fileSize: 500 },
    });

    const { operations } = await makeService(prisma).getMediumStats();

    expect(operations.imageCount).toBe(12);
    expect(operations.imageBytes).toBe(3000);
    expect(operations.documentCount).toBe(4);
    expect(operations.documentBytes).toBe(500);
    expect(operations.storageBytes).toBe(3500);
  });

  it('treats a medium with no uploads as zero, not null', async () => {
    const { operations } = await makeService(makePrisma()).getMediumStats();

    expect(operations.imageBytes).toBe(0);
    expect(operations.documentBytes).toBe(0);
    expect(operations.storageBytes).toBe(0);
    expect(operations.documentCount).toBe(0);
  });

  it('counts documents even when there are no images', async () => {
    const prisma = makePrisma();
    prisma.document.aggregate.mockResolvedValue({
      _count: { _all: 9 },
      _sum: { fileSize: 900 },
    });

    const { operations } = await makeService(prisma).getMediumStats();

    expect(operations.storageBytes).toBe(900);
  });
});
