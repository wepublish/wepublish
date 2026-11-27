import type { PrismaClient } from '@prisma/client';
import type { FeaturesService } from '@wepublish/features/api';
import { PrintIssueStartService } from './print-issue-start.service';

const issue = (overrides: Record<string, unknown> = {}) => ({
  id: 'issue-117',
  number: 117,
  numberTo: null,
  year: 2026,
  title: 'Fankurve',
  issueDate: new Date('2026-11-13T00:00:00.000Z'),
  ...overrides,
});

const make = ({
  enabled = true,
  current = issue() as ReturnType<typeof issue> | null,
  upcoming = issue({
    id: 'issue-118',
    number: 118,
    title: null,
    issueDate: new Date('2026-12-11T00:00:00.000Z'),
  }) as ReturnType<typeof issue> | null,
} = {}) => {
  const prisma = {
    printIssue: {
      findFirst: vi.fn(async ({ where }: { where: { issueDate: object } }) =>
        'lte' in where.issueDate ? current : upcoming
      ),
    },
    setting: {
      findUnique: vi.fn(async ({ where }: { where: { name: string } }) =>
        where.name === 'printIssueNumbering' ? { value: 'continuous' }
        : where.name === 'printIssueLabelFormat' ? { value: '#{range}' }
        : null
      ),
    },
  };
  const features = { isEnabled: vi.fn(async () => enabled) };
  const service = new PrintIssueStartService(
    prisma as unknown as PrismaClient,
    features as unknown as FeaturesService
  );

  return { service, prisma, features };
};

describe('PrintIssueStartService', () => {
  it('names the issue shipped last and the next one, as the medium writes them', async () => {
    const { service, prisma } = make();

    expect(await service.start('2026-11-20')).toEqual({
      current: {
        id: 'issue-117',
        label: '#117',
        title: 'Fankurve',
        issueDate: '2026-11-13',
      },
      upcoming: {
        id: 'issue-118',
        label: '#118',
        title: null,
        issueDate: '2026-12-11',
      },
    });
    // the current one: shipped today at the latest, whatever its status
    expect(prisma.printIssue.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { issueDate: { lte: new Date('2026-11-20T00:00:00.000Z') } },
        orderBy: [{ issueDate: 'desc' }, { number: 'desc' }],
      })
    );
    expect(prisma.printIssue.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { issueDate: { gt: new Date('2026-11-20T00:00:00.000Z') } },
        orderBy: [{ issueDate: 'asc' }, { number: 'asc' }],
      })
    );
  });

  it('has no upcoming issue until it is created', async () => {
    const { service } = make({ upcoming: null });

    expect(await service.start('2026-11-20')).toMatchObject({
      upcoming: null,
    });
  });

  it('offers nothing without a shipped issue or while the print export is off', async () => {
    expect(await make({ current: null }).service.start('2026-11-20')).toBe(
      null
    );

    const off = make({ enabled: false });

    expect(await off.service.start('2026-11-20')).toBe(null);
    expect(off.features.isEnabled).toHaveBeenCalledWith('print-export');
    expect(off.prisma.printIssue.findFirst).not.toHaveBeenCalled();
  });
});
