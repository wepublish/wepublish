import { PrismaClient } from '@prisma/client';
import { DashboardInvoiceService } from '@wepublish/membership/api';
import {
  DEFAULT_WINDOW_DAYS,
  MediumStatsService,
  resolveWindow,
  sumInvoiceAmounts,
  busiestEditorShare,
  summariseErrorMessage,
  summariseErrors,
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
  changelogEntry: {
    count: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
  };
  image: { aggregate: jest.Mock };
  document: { aggregate: jest.Mock };
  subscription: { count: jest.Mock };
  auditLog: {
    count: jest.Mock;
    findMany: jest.Mock;
    groupBy: jest.Mock;
  };
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
    changelogEntry: {
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
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
    auditLog: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      groupBy: jest.fn().mockResolvedValue([]),
    },
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

describe('MediumStatsService changelog actions', () => {
  const released = new Date('2026-09-16T08:00:00.000Z');

  async function operations(prisma: PrismaStub) {
    const stats = await makeService(prisma).getMediumStats({});

    return stats.operations.changelog;
  }

  it('reports nothing open when no action is required', async () => {
    const prisma = makePrisma();

    expect(await operations(prisma)).toEqual({
      openActions: 0,
      oldestOpenActionAt: null,
    });
  });

  it('counts only unconfirmed action-required entries', async () => {
    const prisma = makePrisma();
    prisma.changelogEntry.count.mockResolvedValue(3);
    prisma.changelogEntry.findFirst.mockResolvedValue({ releasedAt: released });

    expect(await operations(prisma)).toEqual({
      openActions: 3,
      oldestOpenActionAt: released,
    });

    expect(prisma.changelogEntry.count).toHaveBeenCalledWith({
      where: { actionRequired: true, confirmedAt: null },
    });
  });

  it('takes the oldest open entry by release date', async () => {
    const prisma = makePrisma();
    prisma.changelogEntry.count.mockResolvedValue(1);
    prisma.changelogEntry.findFirst.mockResolvedValue({ releasedAt: released });

    await operations(prisma);

    expect(prisma.changelogEntry.findFirst).toHaveBeenCalledWith({
      where: { actionRequired: true, confirmedAt: null },
      orderBy: { releasedAt: 'asc' },
      select: { releasedAt: true },
    });
  });

  it('survives a database without the changelog table', async () => {
    const prisma = makePrisma();
    prisma.changelogEntry.count.mockRejectedValue(new Error('no such table'));

    expect(await operations(prisma)).toEqual({
      openActions: 0,
      oldestOpenActionAt: null,
    });
  });
});

describe('MediumStatsService.listChangelogActions', () => {
  const released = new Date('2026-09-16T08:00:00.000Z');
  const confirmed = new Date('2026-09-16T09:30:00.000Z');

  it('lists informative entries too, flagged as no task', async () => {
    const prisma = makePrisma();
    prisma.changelogEntry.findMany = jest.fn().mockResolvedValue([
      {
        id: 'i1',
        name: '20260916080000_news',
        title: 'Just news',
        actionRequired: false,
        releasedAt: released,
        confirmedAt: null,
        confirmedBy: null,
      },
    ]);

    const [entry] = await makeService(prisma).listChangelogActions();

    expect(prisma.changelogEntry.findMany).toHaveBeenCalledWith(
      expect.not.objectContaining({ where: expect.anything() })
    );
    expect(entry.actionRequired).toBe(false);
  });

  it('maps the confirming user to a name and an email', async () => {
    const prisma = makePrisma();
    prisma.changelogEntry.findMany = jest.fn().mockResolvedValue([
      {
        id: 'e1',
        name: '20260916080000_entry',
        title: 'Do the thing',
        actionRequired: true,
        releasedAt: released,
        confirmedAt: confirmed,
        confirmedBy: {
          name: 'Muster',
          firstName: 'Anna',
          email: 'anna@example.ch',
        },
      },
    ]);

    const [action] = await makeService(prisma).listChangelogActions();

    expect(action).toEqual({
      id: 'e1',
      name: '20260916080000_entry',
      title: 'Do the thing',
      actionRequired: true,
      releasedAt: released,
      confirmedAt: confirmed,
      confirmedByName: 'Anna Muster',
      confirmedByEmail: 'anna@example.ch',
    });
  });

  it('reports an open action with no one attached', async () => {
    const prisma = makePrisma();
    prisma.changelogEntry.findMany = jest.fn().mockResolvedValue([
      {
        id: 'e2',
        name: '20260916080000_open',
        title: 'Still open',
        actionRequired: true,
        releasedAt: released,
        confirmedAt: null,
        confirmedBy: null,
      },
    ]);

    const [action] = await makeService(prisma).listChangelogActions();

    expect(action.confirmedAt).toBeNull();
    expect(action.confirmedByName).toBeNull();
    expect(action.confirmedByEmail).toBeNull();
  });

  it('falls back to the last name when no first name is set', async () => {
    const prisma = makePrisma();
    prisma.changelogEntry.findMany = jest.fn().mockResolvedValue([
      {
        id: 'e3',
        name: '20260916080000_entry',
        title: 'Do the thing',
        actionRequired: true,
        releasedAt: released,
        confirmedAt: confirmed,
        confirmedBy: { name: 'Muster', firstName: null, email: 'm@example.ch' },
      },
    ]);

    const [action] = await makeService(prisma).listChangelogActions();

    expect(action.confirmedByName).toBe('Muster');
  });

  it('answers empty when the changelog table is missing', async () => {
    const prisma = makePrisma();
    prisma.changelogEntry.findMany = jest
      .fn()
      .mockRejectedValue(new Error('no such table'));

    expect(await makeService(prisma).listChangelogActions()).toEqual([]);
  });
});

describe('MediumStatsService audit', () => {
  const now = new Date('2026-09-16T12:00:00.000Z');

  it('reports the counts and marks the log as supported', async () => {
    const prisma = makePrisma();
    prisma.auditLog.count
      .mockResolvedValueOnce(120)
      .mockResolvedValueOnce(9)
      .mockResolvedValueOnce(4);
    prisma.auditLog.findMany.mockResolvedValue([
      { userID: 'a' },
      { userID: 'b' },
    ]);
    prisma.auditLog.groupBy.mockResolvedValue([
      { mutation: 'updateArticle', _count: { _all: 70 } },
      { mutation: 'createArticle', _count: { _all: 50 } },
    ]);

    const stats = await makeService(prisma).getMediumStats({ now });

    expect(stats.audit).toMatchObject({
      supported: true,
      actions: 120,
      failedActions: 9,
      impersonatedActions: 4,
      activeEditors: 2,
    });
  });

  it('sorts the mutation usage by how often it was used', async () => {
    const prisma = makePrisma();
    prisma.auditLog.groupBy.mockResolvedValue([
      { mutation: 'createPaywall', _count: { _all: 2 } },
      { mutation: 'updateArticle', _count: { _all: 88 } },
    ]);

    const stats = await makeService(prisma).getMediumStats({ now });

    expect(stats.audit.mutationUsage).toEqual([
      { mutation: 'updateArticle', count: 88 },
      { mutation: 'createPaywall', count: 2 },
    ]);
  });

  it('counts active editors over a trailing 30 days, not the window', async () => {
    const prisma = makePrisma();

    await makeService(prisma).getMediumStats({
      from: new Date('2026-09-16T00:00:00.000Z'),
      to: new Date('2026-09-16T23:59:59.999Z'),
      now,
    });

    const editorQuery = prisma.auditLog.findMany.mock.calls[0][0];

    expect(editorQuery.distinct).toEqual(['userID']);
    expect(editorQuery.where.createdAt.gte).toEqual(
      new Date('2026-08-17T23:59:59.999Z')
    );
  });

  it('reports an installation without the audit log as unsupported, not as quiet', async () => {
    const prisma = makePrisma();
    prisma.auditLog.count.mockRejectedValue(
      new Error('relation "audit_logs" does not exist')
    );

    const stats = await makeService(prisma).getMediumStats({ now });

    expect(stats.audit.supported).toBe(false);
    expect(stats.audit.actions).toBe(0);
  });

  it('still delivers the other stats when the audit log fails', async () => {
    const prisma = makePrisma();
    prisma.auditLog.count.mockRejectedValue(new Error('table missing'));
    prisma.article.count.mockResolvedValue(42);

    const stats = await makeService(prisma).getMediumStats({ now });

    expect(stats.editorial.articlesCount).toBe(42);
  });
});

describe('summariseErrorMessage', () => {
  it('survives a Prisma message, which opens with a newline', () => {
    // Copied from a real failed deleteTag on a local instance. Taking line one
    // literally yields '', which silently dropped every Prisma failure.
    const real = [
      '',
      'Invalid `this.prisma.tag.delete()` invocation in',
      '/home/elias/gitroot/wepublish/dist/apps/api-example/main.js:25221:42',
      '',
      'An operation failed because it depends on one or more records that were required but not found.',
    ].join('\n');

    expect(summariseErrorMessage(real)).toBe(
      'Invalid `this.prisma.tag.delete()` invocation in'
    );
  });

  it('keeps only the first line', () => {
    expect(
      summariseErrorMessage('Invalid invocation\n  at /home/elias/x.js:12')
    ).toBe('Invalid invocation');
  });

  it('does not carry absolute paths of the medium machine to One', () => {
    const prisma = [
      'Invalid `this.prisma.tag.delete()` invocation in',
      '/home/elias/gitroot/wepublish/dist/apps/api-example/main.js:25196:42',
    ].join('\n');

    expect(summariseErrorMessage(prisma)).not.toContain('/home/elias');
  });

  it('caps a single runaway line', () => {
    expect(summariseErrorMessage('x'.repeat(500))).toHaveLength(200);
  });
});

describe('summariseErrors', () => {
  const entry = (errorMessage: string | null, count: number) => ({
    errorMessage,
    _count: { _all: count },
  });

  it('merges messages that differ only below the first line', () => {
    const result = summariseErrors([
      entry('Forbidden resource\n  at a.js', 3),
      entry('Forbidden resource\n  at b.js', 4),
    ]);

    expect(result).toEqual([{ message: 'Forbidden resource', count: 7 }]);
  });

  it('puts the worst error first', () => {
    const result = summariseErrors([entry('rare', 1), entry('common', 9)]);

    expect(result[0]).toEqual({ message: 'common', count: 9 });
  });

  it('ignores rows without a message', () => {
    expect(summariseErrors([entry(null, 5), entry('   ', 2)])).toEqual([]);
  });

  it('keeps the list short enough to read', () => {
    const many = Array.from({ length: 20 }, (_, i) => entry(`e${i}`, 20 - i));

    expect(summariseErrors(many)).toHaveLength(5);
  });
});

describe('MediumStatsService top errors', () => {
  it('reports the errors editors actually ran into', async () => {
    const prisma = makePrisma();
    prisma.auditLog.groupBy.mockResolvedValueOnce([]).mockResolvedValueOnce([
      { errorMessage: 'Forbidden resource', _count: { _all: 12 } },
      { errorMessage: 'Unique constraint failed', _count: { _all: 3 } },
    ]);

    const stats = await makeService(prisma).getMediumStats({
      now: new Date('2026-09-16T12:00:00.000Z'),
    });

    expect(stats.audit.topErrors).toEqual([
      { message: 'Forbidden resource', count: 12 },
      { message: 'Unique constraint failed', count: 3 },
    ]);
  });

  it('is empty when the installation keeps no audit log', async () => {
    const prisma = makePrisma();
    prisma.auditLog.count.mockRejectedValue(new Error('table missing'));

    const stats = await makeService(prisma).getMediumStats();

    expect(stats.audit.topErrors).toEqual([]);
  });
});

describe('busiestEditorShare', () => {
  const actor = (count: number) => ({ _count: { _all: count } });

  it('is null when nobody acted — a share of nothing is not zero', () => {
    expect(busiestEditorShare([])).toBeNull();
  });

  it('is one when a single account does everything', () => {
    expect(busiestEditorShare([actor(40)])).toBe(1);
  });

  it('tells a lopsided newsroom from a balanced one of the same size', () => {
    const balanced = busiestEditorShare([
      actor(25),
      actor(25),
      actor(25),
      actor(25),
    ]);
    const lopsided = busiestEditorShare([
      actor(90),
      actor(4),
      actor(3),
      actor(3),
    ]);

    expect(balanced).toBe(0.25);
    expect(lopsided).toBe(0.9);
  });
});

describe('MediumStatsService concentration and action mix', () => {
  const now = new Date('2026-09-16T12:00:00.000Z');

  it('reports the busiest account share and the action mix', async () => {
    const prisma = makePrisma();
    prisma.auditLog.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { userID: 'a', _count: { _all: 80 } },
        { userID: 'b', _count: { _all: 20 } },
      ])
      .mockResolvedValueOnce([
        { action: 'update', _count: { _all: 70 } },
        { action: 'create', _count: { _all: 30 } },
      ]);

    const stats = await makeService(prisma).getMediumStats({ now });

    expect(stats.audit.topEditorShare).toBe(0.8);
    expect(stats.audit.actionsByType).toEqual([
      { action: 'update', count: 70 },
      { action: 'create', count: 30 },
    ]);
  });

  it('leaves token work out of the concentration', async () => {
    const prisma = makePrisma();

    await makeService(prisma).getMediumStats({ now });

    const actorQuery = prisma.auditLog.groupBy.mock.calls[2][0];

    expect(actorQuery.where.userID).toEqual({ not: null });
  });
});
