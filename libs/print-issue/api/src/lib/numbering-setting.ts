import type { PrismaClient } from '@prisma/client';
import { type IssueNumberingConfig, issueNumberingOf } from '@wepublish/utils';

export const PRINT_ISSUE_NUMBERING_SETTING = 'printIssueNumbering';
export const PRINT_ISSUE_LABEL_FORMAT_SETTING = 'printIssueLabelFormat';

/**
 * How the medium numbers its issues (Einstellungen › Druckausgaben). Anything
 * missing or invalid falls back to «6.26» per year, so a bad value never
 * breaks a print run.
 */
export async function readIssueNumbering(
  prisma: Pick<PrismaClient, 'setting'>
): Promise<IssueNumberingConfig> {
  const [counting, format] = await Promise.all([
    prisma.setting.findUnique({
      where: { name: PRINT_ISSUE_NUMBERING_SETTING },
    }),
    prisma.setting.findUnique({
      where: { name: PRINT_ISSUE_LABEL_FORMAT_SETTING },
    }),
  ]);

  return issueNumberingOf(counting?.value, format?.value);
}
