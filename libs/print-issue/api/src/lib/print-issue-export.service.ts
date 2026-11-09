import { Injectable } from '@nestjs/common';
import { PrintIssueStatus, PrismaClient } from '@prisma/client';
import { BexioPrintSourceService } from './bexio/bexio-print-source.service';
import { runExport, type ExportResult } from './export/run';
import { loadMembers } from './members/load';
import type { PrintExportOptions } from './options';
import { dbDateToYmd } from './rules/dates';
import type { QuotaConfig } from './rules/entitlement';
import { issueLabel } from './rules/issue';

export const PRINT_ISSUES_PER_YEAR_SETTING = 'printIssuesPerYear';

export type ExportableIssue = {
  id: string;
  number: number;
  year: number;
  issueDate: Date;
};

export type ComputeInput = {
  /** what the list is computed from: the issue's options */
  options: PrintExportOptions;
  /** evaluate as of this Zurich day instead of the ship day (a Nachlieferung) */
  evaluateAt?: string;
  /** what other deliveries of the same issue already exported */
  excludeSubscriptionIds?: string[];
  excludeBexioInvoiceIds?: number[];
};

/** Runs the export of one issue against the live data. */
@Injectable()
export class PrintIssueExportService {
  constructor(
    private prisma: PrismaClient,
    private bexioSource: BexioPrintSourceService
  ) {}

  async compute(
    issue: ExportableIssue,
    {
      options,
      evaluateAt,
      excludeSubscriptionIds,
      excludeBexioInvoiceIds,
    }: ComputeInput
  ): Promise<ExportResult> {
    const [quota, bexio] = await Promise.all([
      this.quota(),
      this.bexioSource.client(),
    ]);

    return runExport(
      {
        issue: issueLabel(issue),
        date: evaluateAt ?? dbDateToYmd(issue.issueDate),
        ...options,
        quota,
        excludeSubscriptionIds,
        excludeBexioInvoiceIds,
      },
      {
        members: () => loadMembers(this.prisma),
        bexio,
      }
    );
  }

  /** The medium's issues per year (0 = owed copies off) and the issues shipped before tracking. */
  private async quota(): Promise<QuotaConfig> {
    const [setting, historic] = await Promise.all([
      this.prisma.setting.findUnique({
        where: { name: PRINT_ISSUES_PER_YEAR_SETTING },
      }),
      this.prisma.printIssue.findMany({
        where: { status: PrintIssueStatus.historic },
        select: { issueDate: true },
      }),
    ]);
    const issuesPerYear = Number(setting?.value ?? 0);

    return {
      issuesPerYear:
        Number.isFinite(issuesPerYear) && issuesPerYear > 0 ? issuesPerYear : 0,
      historicIssues: historic.map(issue => ({
        issueDate: dbDateToYmd(issue.issueDate),
      })),
    };
  }
}
