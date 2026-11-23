import { PrintIssueStatus, type PrismaClient } from '@prisma/client';
import { dbDateToYmd } from './rules/dates';
import type { QuotaConfig } from './rules/entitlement';

export const PRINT_ISSUES_PER_YEAR_SETTING = 'printIssuesPerYear';

/** The medium's issues per year (0 = owed copies off) and the issues shipped before tracking. */
export async function readQuota(
  prisma: Pick<PrismaClient, 'setting' | 'printIssue'>
): Promise<QuotaConfig> {
  const [setting, historic] = await Promise.all([
    prisma.setting.findUnique({
      where: { name: PRINT_ISSUES_PER_YEAR_SETTING },
    }),
    prisma.printIssue.findMany({
      where: { status: PrintIssueStatus.historic },
      select: { issueDate: true, countsAs: true },
    }),
  ]);
  const issuesPerYear = Number(setting?.value ?? 0);

  return {
    issuesPerYear:
      Number.isFinite(issuesPerYear) && issuesPerYear > 0 ? issuesPerYear : 0,
    historicIssues: historic.map(issue => ({
      issueDate: dbDateToYmd(issue.issueDate),
      countsAs: issue.countsAs,
    })),
  };
}
