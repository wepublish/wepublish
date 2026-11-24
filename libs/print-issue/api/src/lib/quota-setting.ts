import { PrintIssueStatus, type PrismaClient } from '@prisma/client';
import { dbDateToYmd } from './rules/dates';
import {
  PRINT_ISSUE_COUNTINGS,
  type PrintIssueCounting,
  type QuotaConfig,
} from './rules/entitlement';

export const PRINT_ISSUES_PER_YEAR_SETTING = 'printIssuesPerYear';
export const PRINT_ISSUE_COUNTING_SETTING = 'printIssueCounting';

/** The counting as stored; anything else counts per period, as before the setting. */
export const printIssueCountingOf = (value: unknown): PrintIssueCounting =>
  PRINT_ISSUE_COUNTINGS.find(counting => counting === value) ?? 'perPeriod';

/**
 * The medium's issues per year (0 = owed copies off), how it counts copies,
 * and the issues shipped before tracking.
 */
export async function readQuota(
  prisma: Pick<PrismaClient, 'setting' | 'printIssue'>
): Promise<QuotaConfig> {
  const [setting, countingSetting, historic] = await Promise.all([
    prisma.setting.findUnique({
      where: { name: PRINT_ISSUES_PER_YEAR_SETTING },
    }),
    prisma.setting.findUnique({
      where: { name: PRINT_ISSUE_COUNTING_SETTING },
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
    counting: printIssueCountingOf(countingSetting?.value),
  };
}
