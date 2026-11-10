import type { PrismaClient } from '@prisma/client';
import type { Mock } from 'vitest';
import type { BexioPrintSourceService } from './bexio/bexio-print-source.service';
import { runExport } from './export/run';
import { PrintIssueExportService } from './print-issue-export.service';

// the real run, watched: the service's job is to hand it the right input
vi.mock('./export/run', async importOriginal => {
  const actual = await importOriginal<typeof import('./export/run')>();

  return { ...actual, runExport: vi.fn(actual.runExport) };
});

const issue = {
  id: 'issue-1',
  number: 1,
  year: 2027,
  issueDate: new Date('2027-01-15T00:00:00.000Z'),
};

const options = {
  memberPlanIds: null,
  includeBexio: true,
  includeOpen: true,
  includeUpcoming: false,
};

const lapsed = {
  id: 's1',
  startsAt: new Date('2025-10-01T00:00:00.000Z'),
  paidUntil: new Date('2026-09-30T00:00:00.000Z'),
  autoRenew: false,
  properties: [],
  userID: 'u1',
  deactivation: {
    date: new Date('2026-09-30T00:00:00.000Z'),
    reason: 'userSelfDeactivated',
  },
  memberPlan: {
    id: 'p1',
    slug: 'nw-jahresabo',
    name: 'Jahresabo',
    productType: 'Subscription',
    periodicityPricing: [],
  },
  periods: [
    {
      id: 'per-1',
      startsAt: new Date('2025-10-01T00:00:00.000Z'),
      endsAt: new Date('2026-09-30T00:00:00.000Z'),
      paymentPeriodicity: 'yearly',
      invoiceID: 'inv-1',
      invoice: {
        paidAt: new Date('2025-10-01T00:00:00.000Z'),
        canceledAt: null,
      },
    },
  ],
  invoices: [],
  printDeliveries: [],
};

describe('PrintIssueExportService', () => {
  let prisma: {
    setting: { findUnique: Mock };
    printIssue: { findMany: Mock };
    subscription: { findMany: Mock };
    user: { findMany: Mock };
  };
  let bexioSource: { client: Mock };
  let service: PrintIssueExportService;

  beforeEach(() => {
    vi.mocked(runExport).mockClear();
    prisma = {
      setting: { findUnique: vi.fn(async () => ({ value: 6 })) },
      printIssue: {
        findMany: vi.fn(async () => [
          { issueDate: new Date('2026-08-23T00:00:00.000Z') },
          { issueDate: new Date('2026-04-10T00:00:00.000Z') },
        ]),
      },
      subscription: { findMany: vi.fn(async () => [lapsed]) },
      user: { findMany: vi.fn(async () => []) },
    };
    bexioSource = { client: vi.fn(async () => null) };
    service = new PrintIssueExportService(
      prisma as unknown as PrismaClient,
      bexioSource as unknown as BexioPrintSourceService
    );
  });

  it('evaluates the issue as of its ship day with the quota from the setting and the historic issues', async () => {
    const result = await service.compute(issue, { options });

    expect(prisma.setting.findUnique).toHaveBeenCalledWith({
      where: { name: 'printIssuesPerYear' },
    });
    expect(prisma.printIssue.findMany).toHaveBeenCalledWith({
      where: { status: 'historic' },
      select: { issueDate: true },
    });
    expect(prisma.subscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          printDeliveries: expect.objectContaining({
            where: { delivery: { deliveredAt: { not: null } } },
          }),
        }),
      })
    );
    expect(result.summary).toMatchObject({
      issue: '1.27',
      date: '2027-01-15',
      grace: 1,
    });
    // both historic issues fall inside the paid period, so two copies are
    // presumed delivered and the third of six is owed
    expect(result.rows[0]!.zahlungsstatus).toBe('Restexemplar 3/6');
    expect(result.summary.bexio.configured).toBe(false);
  });

  it('can evaluate later than the ship day and leave earlier batches out', async () => {
    const result = await service.compute(issue, {
      options,
      evaluateAt: '2027-02-01',
      excludeSubscriptionIds: ['s1'],
      excludeBexioInvoiceIds: [7],
    });

    expect(result.summary).toMatchObject({
      date: '2027-02-01',
      rows: 0,
      alreadyExported: 1,
    });
  });

  it('switches the owed-copies rule off while the setting is 0 or missing', async () => {
    prisma.setting.findUnique.mockResolvedValue(null);

    const result = await service.compute(issue, { options });

    expect(result.summary).toMatchObject({
      grace: 0,
      skipped: { deactivated: 1 },
    });
  });

  it('hands the bexio client of the payment provider to the run', async () => {
    const client = {
      invoicesInWindow: vi.fn(async () => ({
        invoices: [],
        path: 'search' as const,
      })),
      positions: vi.fn(async () => []),
      contacts: vi.fn(async () => new Map()),
      countries: vi.fn(async () => new Map()),
      salutations: vi.fn(async () => new Map()),
    };
    bexioSource.client.mockResolvedValue(client);

    const result = await service.compute(issue, { options });

    expect(client.invoicesInWindow).toHaveBeenCalledWith(
      '2022-01-01',
      '2027-12-31'
    );
    expect(result.summary.bexio).toMatchObject({
      configured: true,
      included: true,
    });
  });

  it('leaves bexio out when the options say so, even with a provider', async () => {
    const client = { invoicesInWindow: vi.fn() };
    bexioSource.client.mockResolvedValue(client);

    const result = await service.compute(issue, {
      options: { ...options, includeBexio: false },
    });

    expect(client.invoicesInWindow).not.toHaveBeenCalled();
    expect(result.summary.bexio).toMatchObject({
      configured: true,
      included: false,
    });
  });

  it('hands every option to the run next to the quota', async () => {
    await service.compute(issue, {
      options: {
        memberPlanIds: ['p1'],
        includeBexio: false,
        includeOpen: false,
        includeUpcoming: true,
      },
    });

    expect(runExport).toHaveBeenCalledWith(
      {
        issue: '1.27',
        date: '2027-01-15',
        memberPlanIds: ['p1'],
        includeBexio: false,
        includeOpen: false,
        includeUpcoming: true,
        quota: {
          issuesPerYear: 6,
          historicIssues: [
            { issueDate: '2026-08-23' },
            { issueDate: '2026-04-10' },
          ],
        },
        excludeSubscriptionIds: undefined,
        excludeBexioInvoiceIds: undefined,
      },
      expect.objectContaining({ bexio: null })
    );
  });
});
