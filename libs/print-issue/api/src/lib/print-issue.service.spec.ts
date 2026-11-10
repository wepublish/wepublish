import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type PrismaClient } from '@prisma/client';
import { emptyRow } from './csv/row';
import { toCsv } from './csv/writer';
import type { ExportResult } from './export/run';
import type { PrintIssueExportService } from './print-issue-export.service';
import { DEFAULT_OPTIONS, PrintIssueService } from './print-issue.service';

const NOW = new Date('2026-12-20T10:00:00.000Z');
const computedAt = new Date('2026-12-20T09:00:00.000Z');

const options = (overrides: Record<string, unknown> = {}) => ({
  memberPlanIds: null,
  includeBexio: true,
  bexioKindIds: null,
  includeOpen: true,
  includeUpcoming: false,
  ...overrides,
});

const delivery = (overrides: Record<string, unknown> = {}) => ({
  id: 'del-0',
  createdAt: new Date('2026-12-19T10:00:00.000Z'),
  issueId: 'issue-1',
  batch: 0,
  createdByUserId: 'editor-1',
  createdBy: { id: 'editor-1', name: 'Muster', firstName: 'Maria' },
  options: options(),
  rowCount: 2,
  copyCount: 2,
  summary: { rows: 2, copies: 2 },
  filename: 'druckliste-1.27-2027-01-15.csv',
  deliveredAt: null,
  deliveredByUserId: null,
  deliveredBy: null,
  ...overrides,
});

const issue = (overrides: Record<string, unknown> = {}) => ({
  id: 'issue-1',
  createdAt: new Date('2026-12-01T00:00:00.000Z'),
  modifiedAt: new Date('2026-12-01T00:00:00.000Z'),
  number: 1,
  year: 2027,
  issueDate: new Date('2027-01-15T00:00:00.000Z'),
  status: 'open',
  note: null,
  options: options(),
  closedAt: null,
  closedByUserId: null,
  closedBy: null,
  pendingRun: null,
  pendingRunAt: null,
  pendingRunByUserId: null,
  pendingRunBy: null,
  deliveries: [] as unknown[],
  ...overrides,
});

const input = (overrides: Record<string, unknown> = {}) => ({
  number: 1,
  year: 2027,
  issueDate: '2027-01-15',
  note: null,
  options: options(),
  historic: false,
  ...overrides,
});

const row = (name: string) => ({
  ...emptyRow(),
  quelle: 'wepublish' as const,
  name,
});

const exportResult = (names: string[] = ['Alpha', 'Beta']): ExportResult => {
  const rows = names.map(name => row(name));

  return {
    rows,
    recipients: rows.map((snapshot, i) => ({
      source: 'wepublish',
      reason: 'paid',
      copies: 1,
      userId: `u${i}`,
      subscriptionId: `s${i}`,
      periodId: `p${i}`,
      bexioInvoiceId: null,
      bexioContactId: null,
      bexioPeriodFrom: null,
      bexioPeriodTo: null,
      snapshot,
    })),
    summary: { rows: rows.length, copies: rows.length, warnings: [] } as never,
    filename: 'druckliste-1.27-2027-01-15.csv',
    csv: toCsv(rows),
  };
};

const storedRun = (
  result: ExportResult,
  extra: Record<string, unknown> = {}
): Record<string, unknown> => ({
  mode: 'export',
  deliveryId: null,
  batch: 0,
  options: options(),
  recipients: result.recipients,
  summary: result.summary,
  filename: result.filename,
  ...extra,
});

const makePrisma = () => {
  const prisma = {
    printIssue: {
      findMany: vi.fn(async () => [issue()]),
      findUnique: vi.fn(async () => issue()),
      create: vi.fn(async ({ data }: any) => issue(data)),
      update: vi.fn(async ({ data }: any) => issue(data)),
      updateMany: vi.fn(async () => ({ count: 1 })),
      delete: vi.fn(async () => issue()),
    },
    printIssueDelivery: {
      findUnique: vi.fn(async () => null),
      create: vi.fn(async ({ data }: any) =>
        delivery({ ...data, id: 'del-new' })
      ),
      update: vi.fn(async ({ data }: any) => delivery(data)),
      updateMany: vi.fn(async () => ({ count: 1 })),
      delete: vi.fn(async () => delivery()),
    },
    printIssueRecipient: {
      findMany: vi.fn(async () => []),
      createMany: vi.fn(async () => ({ count: 0 })),
      deleteMany: vi.fn(async () => ({ count: 0 })),
    },
    setting: { findUnique: vi.fn(async () => null) },
    $transaction: vi.fn(async (run: (tx: unknown) => unknown) => run(prisma)),
  };

  return prisma;
};

const makeService = (prisma = makePrisma()) => {
  const exporter = { compute: vi.fn(async () => exportResult()) };
  const service = new PrintIssueService(
    prisma as unknown as PrismaClient,
    exporter as unknown as PrintIssueExportService
  );

  return { service, prisma, exporter };
};

const INCLUDE = {
  closedBy: { select: { id: true, name: true, firstName: true } },
  deliveries: {
    orderBy: { batch: 'asc' },
    include: {
      createdBy: { select: { id: true, name: true, firstName: true } },
      deliveredBy: { select: { id: true, name: true, firstName: true } },
    },
  },
};

describe('PrintIssueService', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterAll(() => vi.useRealTimers());

  describe('issues', () => {
    it('lists the newest issue first, with its deliveries but without the stored run', async () => {
      const { service, prisma } = makeService();

      await service.list();

      expect(prisma.printIssue.findMany).toHaveBeenCalledWith({
        orderBy: [{ issueDate: 'desc' }, { number: 'desc' }],
        include: INCLUDE,
        omit: { pendingRun: true },
      });
    });

    it('tells a missing issue apart', async () => {
      const { service, prisma } = makeService();
      prisma.printIssue.findUnique.mockResolvedValue(null as never);

      await expect(service.findById('nope')).rejects.toBeInstanceOf(
        NotFoundException
      );
    });

    it('creates an open issue with the ship day as a calendar date and the given options', async () => {
      const { service, prisma } = makeService();

      await service.create(
        input({ note: 'Januar', options: options({ includeUpcoming: true }) })
      );

      expect(prisma.printIssue.create).toHaveBeenCalledWith({
        data: {
          number: 1,
          year: 2027,
          issueDate: new Date('2027-01-15T00:00:00.000Z'),
          status: 'open',
          note: 'Januar',
          options: options({ includeUpcoming: true }),
        },
        include: INCLUDE,
      });
    });

    it("starts a new issue from the medium's default options when none are given", async () => {
      const { service, prisma } = makeService();
      prisma.setting.findUnique.mockResolvedValue({
        value: { memberPlanIds: ['plan-a'], includeBexio: false },
      } as never);

      await service.create(input({ options: undefined }));

      expect(prisma.setting.findUnique).toHaveBeenCalledWith({
        where: { name: 'printExportDefaults' },
      });
      expect(prisma.printIssue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            options: {
              ...DEFAULT_OPTIONS,
              memberPlanIds: ['plan-a'],
              includeBexio: false,
            },
          }),
        })
      );
    });

    it('stores the image of a new issue', async () => {
      const { service, prisma } = makeService();

      await service.create(input({ imageId: 'img-1' }));

      expect(prisma.printIssue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ imageId: 'img-1' }),
        })
      );
    });

    it('creates an issue shipped before tracking as historic', async () => {
      const { service, prisma } = makeService();

      await service.create(
        input({
          number: 6,
          year: 2026,
          issueDate: '2026-10-14',
          historic: true,
        })
      );

      expect(prisma.printIssue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'historic' }),
        })
      );
    });

    it('refuses nonsense', async () => {
      const { service } = makeService();

      for (const bad of [
        { number: 0 },
        { year: 1999 },
        { issueDate: '2027-02-30' },
        { issueDate: '15.01.2027' },
        { options: options({ memberPlanIds: 'all' }) },
      ]) {
        await expect(service.create(input(bad))).rejects.toBeInstanceOf(
          BadRequestException
        );
      }
    });

    it('reports a second issue with the same number as a conflict', async () => {
      const { service, prisma } = makeService();
      prisma.printIssue.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('unique', {
          code: 'P2002',
          clientVersion: 'test',
        })
      );

      await expect(service.create(input())).rejects.toBeInstanceOf(
        ConflictException
      );
    });

    it('updates an open issue and never its status', async () => {
      const { service, prisma } = makeService();

      await service.update('issue-1', input({ note: 'x', historic: true }));

      expect(prisma.printIssue.update).toHaveBeenCalledWith({
        where: { id: 'issue-1' },
        data: expect.objectContaining({ note: 'x', status: 'open' }),
        include: INCLUDE,
      });
    });

    it('changes or removes the image only when the input names it', async () => {
      const { service, prisma } = makeService();

      await service.update('issue-1', input({ imageId: 'img-2' }));
      expect(prisma.printIssue.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ imageId: 'img-2' }),
        })
      );

      await service.update('issue-1', input({ imageId: null }));
      expect(prisma.printIssue.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ imageId: null }),
        })
      );

      // e.g. saving the options on the Druckliste view: the image stays
      await service.update('issue-1', input());
      expect(
        prisma.printIssue.update.mock.calls.at(-1)?.[0].data
      ).not.toHaveProperty('imageId');
    });

    it('keeps an imported historic issue historic when it is corrected', async () => {
      const { service, prisma } = makeService();
      prisma.printIssue.findUnique.mockResolvedValue(
        issue({ status: 'historic' }) as never
      );

      await service.update(
        'issue-1',
        input({ issueDate: '2026-10-14', number: 6, year: 2026 })
      );

      expect(prisma.printIssue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'historic', number: 6 }),
        })
      );
    });

    it('drops a computed list when an edit changes what it was computed from', async () => {
      const { service, prisma } = makeService();
      prisma.printIssue.findUnique.mockResolvedValue(
        issue({ pendingRunAt: computedAt }) as never
      );

      await service.update('issue-1', input({ issueDate: '2027-01-16' }));
      expect(prisma.printIssue.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ pendingRun: Prisma.DbNull }),
        })
      );

      await service.update(
        'issue-1',
        input({ options: options({ includeBexio: false }) })
      );
      expect(prisma.printIssue.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ pendingRun: Prisma.DbNull }),
        })
      );

      await service.update('issue-1', input({ note: 'only the note' }));
      expect(
        prisma.printIssue.update.mock.calls.at(-1)![0].data
      ).not.toHaveProperty('pendingRun');
    });

    it('deletes an issue only while no list was handed over', async () => {
      const { service, prisma } = makeService();
      prisma.printIssue.findUnique.mockResolvedValue(
        issue({ deliveries: [delivery({ deliveredAt: null })] }) as never
      );
      await service.delete('issue-1');
      expect(prisma.printIssue.delete).toHaveBeenCalledWith({
        where: { id: 'issue-1' },
      });

      prisma.printIssue.findUnique.mockResolvedValue(
        issue({ deliveries: [delivery({ deliveredAt: NOW })] }) as never
      );
      await expect(service.delete('issue-1')).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('duplicates an issue as the next number with the same options and no ship day', async () => {
      const { service, prisma } = makeService();
      prisma.printIssue.findUnique.mockResolvedValue(
        issue({
          number: 3,
          year: 2027,
          imageId: 'img-1',
          options: options({ includeUpcoming: true }),
        }) as never
      );
      prisma.printIssue.findMany.mockResolvedValue([
        issue({ number: 3 }),
        issue({ number: 1 }),
      ] as never);

      const copy = await service.duplicate('issue-1');

      expect(prisma.printIssue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            number: 4,
            year: 2027,
            status: 'open',
            options: options({ includeUpcoming: true }),
          }),
        })
      );
      // each issue has its own cover: the copy starts without one
      expect(
        prisma.printIssue.create.mock.calls.at(-1)?.[0].data
      ).not.toHaveProperty('imageId');
      expect(copy).toBeDefined();
    });
  });

  describe('compute: the mode follows the state', () => {
    it('computes the export of an issue without deliveries and stores the run', async () => {
      const { service, prisma, exporter } = makeService();

      const run = await service.computeRun('issue-1', 'editor-1');

      expect(exporter.compute).toHaveBeenCalledWith(issue(), {
        options: options(),
      });
      expect(prisma.printIssue.update).toHaveBeenCalledWith({
        where: { id: 'issue-1' },
        data: {
          pendingRun: storedRun(exportResult()),
          pendingRunAt: NOW,
          pendingRunByUserId: 'editor-1',
        },
        select: { id: true },
      });
      expect(run).toMatchObject({ mode: 'export', batch: 0, computedAt: NOW });
    });

    it('re-runs the newest delivery while it is not handed over', async () => {
      const { service, prisma, exporter } = makeService();
      prisma.printIssue.findUnique.mockResolvedValue(
        issue({ deliveries: [delivery({ id: 'del-0', batch: 0 })] }) as never
      );

      const run = await service.computeRun('issue-1', 'editor-1');

      // the rows of the delivery being replaced do not count as already exported
      expect(exporter.compute).toHaveBeenCalledWith(expect.anything(), {
        options: options(),
      });
      expect(run).toMatchObject({
        mode: 'replace',
        deliveryId: 'del-0',
        batch: 0,
      });
    });

    it('computes a Nachlieferung once every delivery is handed over', async () => {
      const { service, prisma, exporter } = makeService();
      prisma.printIssue.findUnique.mockResolvedValue(
        issue({
          deliveries: [delivery({ id: 'del-0', deliveredAt: NOW })],
        }) as never
      );
      prisma.printIssueRecipient.findMany.mockResolvedValue([
        { subscriptionId: 's0', bexioInvoiceId: null, bexioContactId: null },
        { subscriptionId: null, bexioInvoiceId: 42, bexioContactId: 7 },
      ] as never);
      exporter.compute.mockResolvedValue(exportResult(['Late']));

      const run = await service.computeRun('issue-1', 'editor-1');

      expect(prisma.printIssueRecipient.findMany).toHaveBeenCalledWith({
        where: { issueId: 'issue-1' },
        select: {
          subscriptionId: true,
          bexioInvoiceId: true,
          bexioContactId: true,
        },
      });
      expect(exporter.compute).toHaveBeenCalledWith(expect.anything(), {
        options: options(),
        // the ship day lies ahead of today, so it still decides
        evaluateAt: '2027-01-15',
        excludeSubscriptionIds: ['s0'],
        // per invoice and recipient: another recipient of invoice 42 is still due
        excludeBexioRecipients: ['42:7'],
      });
      expect(run).toMatchObject({
        mode: 'supplement',
        batch: 1,
        filename: 'druckliste-1.27-2027-01-15-nachlieferung-1.csv',
      });
      expect(run.rows[0]).toMatchObject({ hinweis: 'Nachlieferung 1' });
    });

    it('evaluates a Nachlieferung as of today once the ship day has passed', async () => {
      const { service, prisma, exporter } = makeService();
      prisma.printIssue.findUnique.mockResolvedValue(
        issue({ deliveries: [delivery({ deliveredAt: NOW })] }) as never
      );
      vi.setSystemTime(new Date('2027-02-01T10:00:00.000Z'));

      await service.computeRun('issue-1', 'editor-1');

      expect(exporter.compute).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ evaluateAt: '2027-02-01' })
      );
      vi.setSystemTime(NOW);
    });

    it('has nothing to compute for a closed or a historic issue', async () => {
      const { service, prisma } = makeService();

      prisma.printIssue.findUnique.mockResolvedValue(
        issue({ status: 'closed' }) as never
      );
      await expect(
        service.computeRun('issue-1', 'editor-1')
      ).rejects.toBeInstanceOf(BadRequestException);
      prisma.printIssue.findUnique.mockResolvedValue(
        issue({ status: 'historic' }) as never
      );
      await expect(
        service.computeRun('issue-1', 'editor-1')
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('hands back the stored run, or nothing', async () => {
      const { service, prisma } = makeService();
      prisma.printIssue.findUnique.mockResolvedValue(
        issue({
          pendingRun: storedRun(exportResult()),
          pendingRunAt: computedAt,
          pendingRunBy: { id: 'editor-1', name: 'Muster', firstName: 'Maria' },
        }) as never
      );

      const run = await service.storedRun('issue-1');
      expect(run).toMatchObject({
        mode: 'export',
        computedAt,
        computedBy: { name: 'Muster' },
      });
      expect(run!.rows.map(r => r.name)).toEqual(['Alpha', 'Beta']);

      prisma.printIssue.findUnique.mockResolvedValue(issue() as never);
      expect(await service.storedRun('issue-1')).toBeNull();
    });
  });

  describe('export: writes exactly the stored run', () => {
    const withRun = (
      prisma: ReturnType<typeof makePrisma>,
      run: Record<string, unknown>,
      extra: Record<string, unknown> = {}
    ) =>
      prisma.printIssue.findUnique.mockResolvedValue(
        issue({
          pendingRun: run,
          pendingRunAt: computedAt,
          pendingRunByUserId: 'editor-1',
          ...extra,
        }) as never
      );

    it('creates the export delivery as batch 0 and clears the run', async () => {
      const { service, prisma, exporter } = makeService();
      const many = exportResult(
        Array.from({ length: 1201 }, (_, i) => `R${i}`)
      );
      withRun(prisma, storedRun(many));

      await service.exportRun('issue-1', 'editor-2', computedAt);

      expect(exporter.compute).not.toHaveBeenCalled();
      expect(prisma.printIssueDelivery.create).toHaveBeenCalledWith({
        data: {
          issueId: 'issue-1',
          batch: 0,
          createdByUserId: 'editor-2',
          options: options(),
          rowCount: 1201,
          copyCount: 1201,
          summary: many.summary,
          filename: 'druckliste-1.27-2027-01-15.csv',
        },
      });
      const chunks = prisma.printIssueRecipient.createMany.mock
        .calls as unknown as [{ data: Record<string, unknown>[] }][];
      expect(chunks).toHaveLength(3);
      expect(chunks[0]![0].data[0]).toEqual({
        issueId: 'issue-1',
        deliveryId: 'del-new',
        batch: 0,
        position: 0,
        source: 'wepublish',
        reason: 'paid',
        copies: 1,
        userId: 'u0',
        subscriptionId: 's0',
        periodId: 'p0',
        bexioInvoiceId: null,
        bexioContactId: null,
        bexioPeriodFrom: null,
        bexioPeriodTo: null,
        snapshot: row('R0'),
      });
      expect(prisma.printIssue.updateMany).toHaveBeenCalledWith({
        where: { id: 'issue-1', pendingRunAt: computedAt },
        data: {
          pendingRun: Prisma.DbNull,
          pendingRunAt: null,
          pendingRunByUserId: null,
        },
      });
    });

    it('stores the bexio period of a row as calendar days', async () => {
      const { service, prisma } = makeService();
      const result = exportResult(['Bib']);
      withRun(
        prisma,
        storedRun({
          ...result,
          recipients: [
            {
              ...result.recipients[0]!,
              source: 'bexio',
              reason: 'external',
              userId: null,
              subscriptionId: null,
              periodId: null,
              bexioInvoiceId: 1,
              bexioContactId: 11,
              bexioPeriodFrom: '2026-03-15',
              bexioPeriodTo: '2027-03-14',
            },
          ],
        })
      );

      await service.exportRun('issue-1', 'editor-1', computedAt);

      const chunks = prisma.printIssueRecipient.createMany.mock
        .calls as unknown as [{ data: Record<string, unknown>[] }][];
      expect(chunks[0]![0].data[0]).toMatchObject({
        bexioInvoiceId: 1,
        bexioContactId: 11,
        bexioPeriodFrom: new Date('2026-03-15T00:00:00.000Z'),
        bexioPeriodTo: new Date('2027-03-14T00:00:00.000Z'),
      });
    });

    it('replaces a delivery that is not handed over: its rows go, the row keeps its batch', async () => {
      const { service, prisma } = makeService();
      withRun(
        prisma,
        storedRun(exportResult(['Neu']), {
          mode: 'replace',
          deliveryId: 'del-0',
        }),
        {
          deliveries: [delivery({ id: 'del-0' })],
        }
      );
      prisma.printIssueDelivery.updateMany.mockResolvedValue({ count: 1 });

      await service.exportRun('issue-1', 'editor-2', computedAt);

      expect(prisma.printIssueRecipient.deleteMany).toHaveBeenCalledWith({
        where: { deliveryId: 'del-0' },
      });
      expect(prisma.printIssueDelivery.updateMany).toHaveBeenCalledWith({
        where: { id: 'del-0', deliveredAt: null },
        data: expect.objectContaining({
          createdAt: NOW,
          createdByUserId: 'editor-2',
          rowCount: 1,
          copyCount: 1,
          options: options(),
        }),
      });
      expect(prisma.printIssueDelivery.create).not.toHaveBeenCalled();
      expect(prisma.printIssueRecipient.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            deliveryId: 'del-0',
            batch: 0,
            snapshot: row('Neu'),
          }),
        ],
      });
    });

    it('refuses to replace a delivery that was handed over in the meantime, writing nothing', async () => {
      const { service, prisma } = makeService();
      withRun(
        prisma,
        storedRun(exportResult(), { mode: 'replace', deliveryId: 'del-0' }),
        {
          deliveries: [delivery({ id: 'del-0', deliveredAt: NOW })],
        }
      );

      await expect(
        service.exportRun('issue-1', 'editor-2', computedAt)
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.printIssueRecipient.deleteMany).not.toHaveBeenCalled();
      expect(prisma.printIssueRecipient.createMany).not.toHaveBeenCalled();
    });

    it('appends a Nachlieferung as the next batch', async () => {
      const { service, prisma } = makeService();
      withRun(
        prisma,
        storedRun(exportResult(['Late']), {
          mode: 'supplement',
          batch: 1,
          filename: 'druckliste-1.27-2027-01-15-nachlieferung-1.csv',
        }),
        { deliveries: [delivery({ deliveredAt: NOW })] }
      );

      await service.exportRun('issue-1', 'editor-2', computedAt);

      expect(prisma.printIssueDelivery.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          batch: 1,
          filename: 'druckliste-1.27-2027-01-15-nachlieferung-1.csv',
        }),
      });
    });

    it('refuses a Nachlieferung whose batch was taken meanwhile', async () => {
      const { service, prisma } = makeService();
      withRun(
        prisma,
        storedRun(exportResult(['Late']), { mode: 'supplement', batch: 1 }),
        {
          deliveries: [
            delivery({ deliveredAt: NOW }),
            delivery({ id: 'del-1', batch: 1, deliveredAt: NOW }),
          ],
        }
      );

      await expect(
        service.exportRun('issue-1', 'editor-2', computedAt)
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses without a run, with a replaced run, and with a run older than 24 hours', async () => {
      const { service, prisma } = makeService();

      await expect(
        service.exportRun('issue-1', 'editor-1', computedAt)
      ).rejects.toBeInstanceOf(BadRequestException);

      withRun(prisma, storedRun(exportResult()));
      await expect(
        service.exportRun(
          'issue-1',
          'editor-1',
          new Date('2026-12-20T08:00:00.000Z')
        )
      ).rejects.toBeInstanceOf(ConflictException);

      const old = new Date('2026-12-19T09:59:00.000Z');
      withRun(prisma, storedRun(exportResult()), { pendingRunAt: old });
      await expect(
        service.exportRun('issue-1', 'editor-1', old)
      ).rejects.toThrow(/24/);
      expect(prisma.printIssueRecipient.createMany).not.toHaveBeenCalled();
    });

    it('refuses to export into a closed issue, writing nothing', async () => {
      const { service, prisma } = makeService();
      withRun(
        prisma,
        storedRun(exportResult(['Late']), { mode: 'supplement', batch: 1 }),
        {
          status: 'closed',
          deliveries: [delivery({ deliveredAt: NOW })],
        }
      );

      await expect(
        service.exportRun('issue-1', 'editor-1', computedAt)
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.printIssueDelivery.create).not.toHaveBeenCalled();
      expect(prisma.printIssueRecipient.createMany).not.toHaveBeenCalled();
    });

    it('stores an empty Nachlieferung as nothing and just drops the run', async () => {
      const { service, prisma } = makeService();
      withRun(
        prisma,
        storedRun(exportResult([]), { mode: 'supplement', batch: 1 }),
        {
          deliveries: [delivery({ deliveredAt: NOW })],
        }
      );

      await service.exportRun('issue-1', 'editor-1', computedAt);

      expect(prisma.printIssueDelivery.create).not.toHaveBeenCalled();
      expect(prisma.printIssue.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ pendingRun: Prisma.DbNull }),
        })
      );
    });
  });

  describe('deliveries: hand over, delete', () => {
    it('marks a delivery as handed over, once and for all', async () => {
      const { service, prisma } = makeService();
      prisma.printIssueDelivery.findUnique.mockResolvedValue(
        delivery() as never
      );

      await service.deliver('del-0', 'editor-1');

      expect(prisma.printIssueDelivery.updateMany).toHaveBeenCalledWith({
        where: { id: 'del-0', deliveredAt: null },
        data: { deliveredAt: NOW, deliveredByUserId: 'editor-1' },
      });

      prisma.printIssueDelivery.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.deliver('del-0', 'editor-1')).rejects.toBeInstanceOf(
        ConflictException
      );
    });

    it('drops a list computed to replace the delivery that was handed over', async () => {
      const { service, prisma } = makeService();
      prisma.printIssueDelivery.findUnique.mockResolvedValue(
        delivery() as never
      );

      await service.deliver('del-0', 'editor-1');

      expect(prisma.printIssue.update).toHaveBeenCalledWith({
        where: { id: 'issue-1' },
        data: {
          pendingRun: Prisma.DbNull,
          pendingRunAt: null,
          pendingRunByUserId: null,
        },
        select: { id: true },
      });
    });

    it('deletes a delivery only while it is not handed over', async () => {
      const { service, prisma } = makeService();
      prisma.printIssueDelivery.findUnique.mockResolvedValue(
        delivery() as never
      );
      await service.deleteDelivery('del-0');
      expect(prisma.printIssueDelivery.delete).toHaveBeenCalledWith({
        where: { id: 'del-0' },
      });

      prisma.printIssueDelivery.findUnique.mockResolvedValue(
        delivery({ deliveredAt: NOW }) as never
      );
      await expect(service.deleteDelivery('del-0')).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('drops the list computed for a delivery with the delivery', async () => {
      const { service, prisma } = makeService();
      prisma.printIssueDelivery.findUnique.mockResolvedValue(
        delivery() as never
      );

      await service.deleteDelivery('del-0');

      expect(prisma.printIssue.update).toHaveBeenCalledWith({
        where: { id: 'issue-1' },
        data: {
          pendingRun: Prisma.DbNull,
          pendingRunAt: null,
          pendingRunByUserId: null,
        },
        select: { id: true },
      });
    });
  });

  describe('close and reopen', () => {
    it('closes an issue once every delivery is handed over', async () => {
      const { service, prisma } = makeService();
      prisma.printIssue.findUnique.mockResolvedValue(
        issue({ deliveries: [delivery({ deliveredAt: NOW })] }) as never
      );

      await service.close('issue-1', 'editor-1');

      expect(prisma.printIssue.update).toHaveBeenCalledWith({
        where: { id: 'issue-1' },
        data: { status: 'closed', closedAt: NOW, closedByUserId: 'editor-1' },
        include: INCLUDE,
      });
    });

    it('refuses to close without a delivery or with one still open', async () => {
      const { service, prisma } = makeService();

      await expect(service.close('issue-1', 'editor-1')).rejects.toBeInstanceOf(
        BadRequestException
      );
      prisma.printIssue.findUnique.mockResolvedValue(
        issue({
          deliveries: [
            delivery({ deliveredAt: NOW }),
            delivery({ id: 'del-1', batch: 1 }),
          ],
        }) as never
      );
      await expect(service.close('issue-1', 'editor-1')).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('reopens a closed issue any time', async () => {
      const { service, prisma } = makeService();
      prisma.printIssue.findUnique.mockResolvedValue(
        issue({ status: 'closed' }) as never
      );

      await service.reopen('issue-1');

      expect(prisma.printIssue.update).toHaveBeenCalledWith({
        where: { id: 'issue-1' },
        data: { status: 'open', closedAt: null, closedByUserId: null },
        include: INCLUDE,
      });
    });
  });

  describe('csv', () => {
    it('writes one delivery, or every delivery merged in export order', async () => {
      const { service, prisma } = makeService();
      prisma.printIssue.findUnique.mockResolvedValue(
        issue({
          deliveries: [delivery(), delivery({ id: 'del-1', batch: 1 })],
        }) as never
      );
      prisma.printIssueRecipient.findMany.mockResolvedValue([
        { batch: 0, position: 0, snapshot: row('One') },
        { batch: 1, position: 0, snapshot: row('Two') },
      ] as never);

      const merged = await service.csv('issue-1');
      expect(prisma.printIssueRecipient.findMany).toHaveBeenLastCalledWith({
        where: { issueId: 'issue-1' },
        orderBy: [{ batch: 'asc' }, { position: 'asc' }],
        select: { batch: true, position: true, snapshot: true },
      });
      expect(merged).toEqual({
        filename: 'druckliste-1.27-2027-01-15-gesamt.csv',
        csv: toCsv([row('One'), row('Two')]),
      });

      await service.csv('issue-1', 'del-1');
      expect(prisma.printIssueRecipient.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: { issueId: 'issue-1', deliveryId: 'del-1' },
        })
      );
    });

    it("names a single delivery's file after the delivery", async () => {
      const { service, prisma } = makeService();
      prisma.printIssue.findUnique.mockResolvedValue(
        issue({
          deliveries: [
            delivery(),
            delivery({
              id: 'del-1',
              batch: 1,
              filename: 'druckliste-1.27-2027-01-15-nachlieferung-1.csv',
            }),
          ],
        }) as never
      );

      const file = await service.csv('issue-1', 'del-1');

      expect(file.filename).toBe(
        'druckliste-1.27-2027-01-15-nachlieferung-1.csv'
      );
    });

    it('has no file without a delivery', async () => {
      const { service } = makeService();

      await expect(service.csv('issue-1')).rejects.toBeInstanceOf(
        BadRequestException
      );
    });
  });
});
