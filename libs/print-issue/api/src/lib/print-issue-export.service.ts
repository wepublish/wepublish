import { Injectable } from '@nestjs/common';
import { PrintIssueStatus, PrismaClient } from '@prisma/client';
import { BexioPrintSourceService } from './bexio/bexio-print-source.service';
import { runExport, type ExportResult } from './export/run';
import { loadMembers } from './members/load';
import type { BexioKind } from './bexio/parse';
import type { PrintExportOptions } from './options';
import { dbDateToYmd } from './rules/dates';
import type { QuotaConfig } from './rules/entitlement';
import { issueLabel, type IssueNumbering } from './rules/issue';

export const PRINT_ISSUES_PER_YEAR_SETTING = 'printIssuesPerYear';
export const PRINT_BEXIO_KINDS_SETTING = 'printBexioKinds';

const isKind = (value: unknown): value is BexioKind => {
  const kind = value as Partial<BexioKind> | null;

  return (
    typeof kind === 'object' &&
    kind !== null &&
    typeof kind.id === 'string' &&
    typeof kind.label === 'string' &&
    typeof kind.word === 'string' &&
    (kind.refersTo === 'period' || kind.refersTo === 'issue')
  );
};

/** The kinds as stored; whatever is not a complete kind is left out. */
export const bexioKindsOf = (value: unknown): BexioKind[] =>
  Array.isArray(value) ? value.filter(isKind) : [];

export type ExportableIssue = IssueNumbering & {
  id: string;
  /** how many issues it counts as against a reader's period: 2 for a double issue */
  countsAs: number;
  issueDate: Date;
};

export type ComputeInput = {
  /** what the list is computed from: the issue's options */
  options: PrintExportOptions;
  /** evaluate as of this Zurich day instead of the ship day (a Nachlieferung) */
  evaluateAt?: string;
  /** what other deliveries of the same issue already exported */
  excludeSubscriptionIds?: string[];
  /** `${invoiceId}:${recipientContactId}` */
  excludeBexioRecipients?: string[];
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
      excludeBexioRecipients,
    }: ComputeInput
  ): Promise<ExportResult> {
    const [quota, bexio, bexioKinds, bexioDelivered] = await Promise.all([
      this.quota(),
      this.bexioSource.client(),
      this.bexioKinds(),
      this.bexioDelivered(),
    ]);
    const shipDay = dbDateToYmd(issue.issueDate);

    return runExport(
      {
        issue: issueLabel(issue),
        countsAs: issue.countsAs,
        date: evaluateAt ?? shipDay,
        ...options,
        quota,
        excludeSubscriptionIds,
        excludeBexioRecipients,
        bexioKinds,
        shipDay,
        bexioDelivered,
      },
      {
        members: () => loadMembers(this.prisma),
        bexio,
      }
    );
  }

  /**
   * Copies bexio periods got in delivered lists, by invoice, recipient and
   * period start: what copies still owed after a period are counted against.
   */
  private async bexioDelivered(): Promise<Record<string, number>> {
    const rows = await this.prisma.printIssueRecipient.findMany({
      where: {
        source: 'bexio',
        bexioPeriodFrom: { not: null },
        delivery: { deliveredAt: { not: null } },
      },
      select: {
        bexioInvoiceId: true,
        bexioContactId: true,
        bexioPeriodFrom: true,
        issue: { select: { countsAs: true } },
      },
    });
    const delivered: Record<string, number> = {};

    for (const row of rows) {
      const key = `${row.bexioInvoiceId}:${row.bexioContactId}:${dbDateToYmd(row.bexioPeriodFrom!)}`;
      // a double issue counts as two copies of the period
      delivered[key] = (delivered[key] ?? 0) + row.issue.countsAs;
    }

    return delivered;
  }

  /** The medium's bexio kinds (Einstellungen › Druckausgaben); none until configured. */
  async bexioKinds(): Promise<BexioKind[]> {
    const setting = await this.prisma.setting.findUnique({
      where: { name: PRINT_BEXIO_KINDS_SETTING },
    });

    return bexioKindsOf(setting?.value);
  }

  /** The medium's issues per year (0 = owed copies off) and the issues shipped before tracking. */
  private async quota(): Promise<QuotaConfig> {
    const [setting, historic] = await Promise.all([
      this.prisma.setting.findUnique({
        where: { name: PRINT_ISSUES_PER_YEAR_SETTING },
      }),
      this.prisma.printIssue.findMany({
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
}
