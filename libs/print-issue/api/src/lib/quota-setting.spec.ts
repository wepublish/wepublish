import { PrintIssueStatus } from '@prisma/client';
import { readQuota } from './quota-setting';

const prismaWith = (settings: Record<string, unknown>) => ({
  setting: {
    findUnique: vi.fn(async ({ where }: { where: { name: string } }) =>
      where.name in settings ? { value: settings[where.name] } : null
    ),
  },
  printIssue: {
    findMany: vi.fn(async () => [
      { issueDate: new Date('2026-08-23T00:00:00.000Z'), countsAs: 2 },
    ]),
  },
});

describe('readQuota', () => {
  it('reads the issues per year, the counting and the historic issues', async () => {
    const prisma = prismaWith({
      printIssuesPerYear: 6,
      printIssueCounting: 'perCopy',
    });

    await expect(readQuota(prisma as never)).resolves.toEqual({
      issuesPerYear: 6,
      counting: 'perCopy',
      historicIssues: [{ issueDate: '2026-08-23', countsAs: 2 }],
    });
    expect(prisma.printIssue.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: PrintIssueStatus.historic },
      })
    );
  });

  // the export and the issue progress must count the same way
  it.each([
    ['missing', undefined],
    ['unknown', 'perWeek'],
  ])('counts per period while the counting is %s', async (_, value) => {
    const prisma = prismaWith(
      value === undefined ?
        { printIssuesPerYear: 6 }
      : { printIssuesPerYear: 6, printIssueCounting: value }
    );

    await expect(readQuota(prisma as never)).resolves.toMatchObject({
      counting: 'perPeriod',
    });
  });

  it('switches the owed copies off while the issues per year are missing or nonsense', async () => {
    for (const value of [undefined, 0, -3, 'x']) {
      const prisma = prismaWith(
        value === undefined ? {} : { printIssuesPerYear: value }
      );

      await expect(readQuota(prisma as never)).resolves.toMatchObject({
        issuesPerYear: 0,
      });
    }
  });
});
