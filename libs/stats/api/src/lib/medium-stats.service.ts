import {
  summarise,
  toMigration,
  type Migration,
  type MigrationRow,
  type MigrationSummary,
} from './migrations';
import { Injectable } from '@nestjs/common';
import { logger } from '@wepublish/utils/api';
import { PrismaClient } from '@prisma/client';
import { DashboardInvoiceService } from '@wepublish/membership/api';
import {
  MEDIUM_STATS_SCHEMA_VERSION,
  MediumAccountStats,
  MediumCommunityStats,
  MediumAuditStats,
  MediumAuditError,
  MediumAuditActionCount,
  MediumEditorialStats,
  MediumIntegrationsStats,
  MediumNetworkStats,
  MediumMailStats,
  MediumMembershipStats,
  MediumMoneyStats,
  MediumChangelogStats,
  MediumOperationsStats,
  MediumStats,
} from './medium-stats.model';

/** Hard cap on how many migration rows one call may return. */
export const MIGRATION_LIST_LIMIT = 200;

/** Hard cap on how many changelog actions one call may return. */
export const CHANGELOG_ACTION_LIST_LIMIT = 200;

export interface ChangelogAction {
  id: string;
  name: string;
  title: string;
  actionRequired: boolean;
  releasedAt: Date;
  confirmedAt: Date | null;
  confirmedByName: string | null;
  confirmedByEmail: string | null;
}

export const DEFAULT_WINDOW_DAYS = 30;

export interface StatsWindow {
  from: Date;
  to: Date;
}

export function resolveWindow(
  from: Date | undefined,
  to: Date | undefined,
  now: Date
): StatsWindow {
  const end = to ?? now;
  const start =
    from ?? new Date(end.getTime() - DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  if (start.getTime() > end.getTime()) {
    throw new Error('from must not be after to');
  }

  return { from: start, to: end };
}

export function sumInvoiceAmounts(
  invoices: readonly { amount: number }[]
): number {
  return invoices.reduce((total, invoice) => total + invoice.amount, 0);
}

const ERROR_MESSAGE_MAX_LENGTH = 200;
const TOP_ERROR_COUNT = 5;

/**
 * The first line of an error that says anything, capped.
 *
 * A Prisma failure carries its whole invocation including absolute paths from
 * the machine it ran on. That is useful in the medium's own log and has no
 * business travelling to One, so only the opening line goes — it is what makes
 * the error recognisable, and the rest is the stack that produced it.
 *
 * The first NON-EMPTY line, because a Prisma message opens with a newline:
 * taking line one literally returned the empty string for the single most
 * common kind of failure, and every one of them was then dropped as unusable.
 */
export const summariseErrorMessage = (message: string): string => {
  const line = message
    .split('\n')
    .map(part => part.trim())
    .find(part => part.length > 0);

  return (line ?? '').slice(0, ERROR_MESSAGE_MAX_LENGTH);
};

/**
 * How much of the named-account work the single busiest account does.
 *
 * Token actions are left out: an integration is not a person, and counting it
 * would make an automated newsroom look like a one-man operation. Null when
 * nobody acted — a share of nothing is not zero concentration.
 */
export const busiestEditorShare = (
  entries: readonly { _count: { _all: number } }[]
): number | null => {
  const counts = entries.map(entry => entry._count._all);
  const total = counts.reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return null;
  }

  return Math.max(...counts) / total;
};

export const summariseErrors = (
  entries: readonly {
    errorMessage: string | null;
    _count: { _all: number };
  }[]
): MediumAuditError[] => {
  const merged = new Map<string, number>();

  for (const entry of entries) {
    if (!entry.errorMessage) {
      continue;
    }

    const message = summariseErrorMessage(entry.errorMessage);

    if (!message) {
      continue;
    }

    merged.set(message, (merged.get(message) ?? 0) + entry._count._all);
  }

  return [...merged.entries()]
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count || a.message.localeCompare(b.message))
    .slice(0, TOP_ERROR_COUNT);
};

@Injectable()
export class MediumStatsService {
  constructor(
    private prisma: PrismaClient,
    private dashboardInvoice: DashboardInvoiceService
  ) {}

  async getMediumStats({
    from,
    to,
    now = new Date(),
  }: { from?: Date; to?: Date; now?: Date } = {}): Promise<MediumStats> {
    const window = resolveWindow(from, to, now);

    const [
      money,
      membership,
      operations,
      editorial,
      audit,
      community,
      mail,
      accounts,
      integrations,
      network,
      currency,
    ] = await Promise.all([
      this.money(window),
      this.membership(window),
      this.operations(),
      this.editorial(window),
      this.audit(window),
      this.community(window),
      this.mail(window),
      this.accounts(window),
      this.integrations(),
      this.network(),
      this.currency(),
    ]);

    return {
      schemaVersion: MEDIUM_STATS_SCHEMA_VERSION,
      generatedAt: now,
      currency,
      window,
      money,
      membership,
      operations,
      editorial,
      audit,
      community,
      mail,
      accounts,
      integrations,
      network,
    };
  }

  private async money({ from, to }: StatsWindow): Promise<MediumMoneyStats> {
    const [earned, expected, atRisk] = await Promise.all([
      this.dashboardInvoice.revenue(from, to),
      this.dashboardInvoice.expectedRevenue(from, to),
      this.atRisk(from, to),
    ]);

    return {
      revenue: sumInvoiceAmounts(earned),
      expectedRevenue: sumInvoiceAmounts(expected),
      atRisk,
    };
  }

  private async atRisk(from: Date, to: Date): Promise<number> {
    const failed = await this.prisma.payment.findMany({
      where: {
        state: { in: ['declined', 'chargeback'] },
        createdAt: { gte: from, lte: to },
      },
      select: { invoiceID: true },
    });

    const invoiceIds = [...new Set(failed.map(payment => payment.invoiceID))];

    if (!invoiceIds.length) {
      return 0;
    }

    const items = await this.prisma.invoiceItem.findMany({
      where: { invoiceId: { in: invoiceIds } },
      select: { quantity: true, amount: true },
    });

    return items.reduce(
      (total, item) => total + item.quantity * item.amount,
      0
    );
  }

  private async membership({
    from,
    to,
  }: StatsWindow): Promise<MediumMembershipStats> {
    const [activeSubscribers, newSubscribers, byReason] = await Promise.all([
      this.prisma.subscription.count({ where: { deactivation: null } }),
      this.prisma.subscription.count({
        where: { createdAt: { gte: from, lte: to } },
      }),
      this.prisma.subscriptionDeactivation.groupBy({
        by: ['reason'],
        where: { date: { gte: from, lte: to } },
        _count: { _all: true },
      }),
    ]);

    const deactivationsByReason = byReason.map(entry => ({
      reason: String(entry.reason),
      count: entry._count._all,
    }));

    return {
      activeSubscribers,
      newSubscribers,
      deactivations: deactivationsByReason.reduce(
        (total, entry) => total + entry.count,
        0
      ),
      deactivationsByReason,
    };
  }

  /**
   * Prisma's own migration table. Read raw because it is not part of the
   * generated client — and read with a hard row cap so a long history cannot
   * turn a stats call into a large response.
   */
  async listMigrations(limit = MIGRATION_LIST_LIMIT): Promise<Migration[]> {
    const rows = await this.prisma.$queryRaw<MigrationRow[]>`
      SELECT id, migration_name, started_at, finished_at, rolled_back_at,
             applied_steps_count, logs
      FROM _prisma_migrations
      ORDER BY started_at DESC
      LIMIT ${Math.min(Math.max(limit, 1), MIGRATION_LIST_LIMIT)}
    `;

    return rows.map(row => toMigration(row));
  }

  private async migrations(): Promise<MigrationSummary> {
    try {
      return summarise(await this.listMigrations());
    } catch (error) {
      // A database without the table (or without permission to read it) must
      // not take the whole stats call down.
      logger('medium-stats').warn(
        `Could not read _prisma_migrations: ${(error as Error).message}`
      );

      return summarise([]);
    }
  }

  async listChangelogActions(
    limit = CHANGELOG_ACTION_LIST_LIMIT
  ): Promise<ChangelogAction[]> {
    try {
      const rows = await this.prisma.changelogEntry.findMany({
        orderBy: { releasedAt: 'desc' },
        take: Math.min(Math.max(limit, 1), CHANGELOG_ACTION_LIST_LIMIT),
        select: {
          id: true,
          name: true,
          title: true,
          actionRequired: true,
          releasedAt: true,
          confirmedAt: true,
          confirmedBy: { select: { name: true, firstName: true, email: true } },
        },
      });

      return rows.map(({ confirmedBy, ...entry }) => ({
        ...entry,
        confirmedByName:
          confirmedBy ?
            [confirmedBy.firstName, confirmedBy.name].filter(Boolean).join(' ')
          : null,
        confirmedByEmail: confirmedBy?.email ?? null,
      }));
    } catch (error) {
      logger('medium-stats').warn(
        `Could not read changelog entries: ${(error as Error).message}`
      );

      return [];
    }
  }

  private async changelogActions(): Promise<MediumChangelogStats> {
    const where = { actionRequired: true, confirmedAt: null };

    try {
      const [openActions, oldest] = await Promise.all([
        this.prisma.changelogEntry.count({ where }),
        this.prisma.changelogEntry.findFirst({
          where,
          orderBy: { releasedAt: 'asc' },
          select: { releasedAt: true },
        }),
      ]);

      return {
        openActions,
        oldestOpenActionAt: oldest?.releasedAt ?? null,
      };
    } catch (error) {
      // A CMS whose database predates the changelog tables must still answer
      // the rest of the stats.
      logger('medium-stats').warn(
        `Could not read changelog entries: ${(error as Error).message}`
      );

      return { openActions: 0, oldestOpenActionAt: null };
    }
  }

  private async operations(): Promise<MediumOperationsStats> {
    const [
      job,
      lastExecuted,
      images,
      documents,
      mailchimpSyncErrors,
      migrations,
      changelog,
    ] = await Promise.all([
      this.prisma.periodicJob.findFirst({ orderBy: { date: 'desc' } }),
      // The newest run that actually executed. The newest ROW may be one
      // that was scheduled and never ran, and reporting its empty
      // executionTime as "no job has ever run" hides exactly the case where
      // the job got stuck — the editor dashboard looks at the same thing
      // (periodic-job-logs.tsx, `jobs.find(pj => !!pj.executionTime)`).
      this.prisma.periodicJob.findFirst({
        where: { executionTime: { not: null } },
        orderBy: { date: 'desc' },
      }),
      this.prisma.image.aggregate({
        _count: { _all: true },
        _sum: { fileSize: true },
      }),
      this.prisma.document.aggregate({
        _count: { _all: true },
        _sum: { fileSize: true },
      }),
      this.prisma.mailchimpSyncError.count(),
      this.migrations(),
      this.changelogActions(),
    ]);

    const imageBytes = images._sum.fileSize ?? 0;
    const documentBytes = documents._sum.fileSize ?? 0;

    return {
      lastPeriodicJobAt: lastExecuted?.executionTime ?? null,
      // Failing means it errored and never got through — a run that errored
      // and then SUCCEEDED on a retry is a warning in the editor dashboard
      // (`getSeverity`: finishedWithError + successfullyFinished => warning),
      // not a failure, and it must not be one here either. Reporting the
      // retry as a failure turned every recovered night into a red medium.
      periodicJobFailing: Boolean(
        job?.finishedWithError && !job?.successfullyFinished
      ),
      periodicJobError: job?.error ?? null,
      periodicJobTries: job?.tries ?? 0,
      imageCount: images._count._all,
      imageBytes,
      documentCount: documents._count._all,
      documentBytes,
      storageBytes: imageBytes + documentBytes,
      mailchimpSyncErrors,
      migrations,
      changelog,
    };
  }

  /**
   * The audit trail in numbers. Every figure is guarded as a unit: an
   * installation whose migration has not run has no `audit_logs` table, and a
   * failing count here must not take the whole stats call down. `supported`
   * tells the caller apart from a quiet medium — zero actions and no audit log
   * look identical otherwise, and one of them is a finding while the other is
   * not.
   */
  private async audit({ from, to }: StatsWindow): Promise<MediumAuditStats> {
    const empty = {
      supported: false,
      actions: 0,
      failedActions: 0,
      activeEditors: 0,
      impersonatedActions: 0,
      topEditorShare: null,
      actionsByType: [],
      topErrors: [],
      mutationUsage: [],
    };

    const inWindow = { createdAt: { gte: from, lte: to } };

    // Deliberately a trailing 30 days rather than the window: the nightly
    // capture asks for a single day, and "distinct people who worked today"
    // collapses to zero every weekend. Thirty days is a state of the newsroom
    // and survives bucketing to a week without lying.
    const editorsFrom = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      const [
        actions,
        failedActions,
        impersonatedActions,
        editors,
        usage,
        errors,
        byActor,
        byType,
      ] = await Promise.all([
        this.prisma.auditLog.count({ where: inWindow }),
        this.prisma.auditLog.count({
          where: { ...inWindow, success: false },
        }),
        this.prisma.auditLog.count({
          where: { ...inWindow, impersonatedBy: { not: null } },
        }),
        this.prisma.auditLog.findMany({
          where: {
            createdAt: { gte: editorsFrom, lte: to },
            userID: { not: null },
          },
          distinct: ['userID'],
          select: { userID: true },
        }),
        this.prisma.auditLog.groupBy({
          by: ['mutation'],
          where: inWindow,
          _count: { _all: true },
        }),
        this.prisma.auditLog.groupBy({
          by: ['errorMessage'],
          where: {
            ...inWindow,
            success: false,
            errorMessage: { not: null },
          },
          _count: { _all: true },
        }),
        this.prisma.auditLog.groupBy({
          by: ['userID'],
          where: { ...inWindow, userID: { not: null } },
          _count: { _all: true },
        }),
        this.prisma.auditLog.groupBy({
          by: ['action'],
          where: inWindow,
          _count: { _all: true },
        }),
      ]);

      return {
        supported: true,
        actions,
        failedActions,
        impersonatedActions,
        activeEditors: editors.length,
        topEditorShare: busiestEditorShare(byActor),
        actionsByType: byType
          .map(entry => ({
            action: String(entry.action),
            count: entry._count._all,
          }))
          .sort((a, b) => b.count - a.count),
        topErrors: summariseErrors(errors),
        mutationUsage: usage
          .map(entry => ({
            mutation: entry.mutation,
            count: entry._count._all,
          }))
          .sort(
            (a, b) => b.count - a.count || a.mutation.localeCompare(b.mutation)
          ),
      };
    } catch (error) {
      logger('medium-stats').warn(
        `Could not read audit logs: ${(error as Error).message}`
      );

      return empty;
    }
  }

  private async editorial({
    from,
    to,
  }: StatsWindow): Promise<MediumEditorialStats> {
    const publishedRevision = { publishedAt: { not: null } };

    const [
      articlesCount,
      authorsCount,
      articlesPublished,
      latest,
      pagesCount,
      pagesPublished,
      articleRevisionsCount,
      pageRevisionsCount,
    ] = await Promise.all([
      this.prisma.article.count({
        where: { revisions: { some: publishedRevision } },
      }),
      this.prisma.author.count(),
      this.prisma.article.count({
        where: { revisions: { some: { publishedAt: { gte: from, lte: to } } } },
      }),
      this.prisma.articleRevision.findFirst({
        where: publishedRevision,
        orderBy: { publishedAt: 'desc' },
        select: { publishedAt: true },
      }),
      this.prisma.page.count({ where: { publishedAt: { not: null } } }),
      this.prisma.page.count({
        where: { publishedAt: { gte: from, lte: to } },
      }),
      this.prisma.articleRevision.count(),
      this.prisma.pageRevision.count(),
    ]);

    return {
      articlesCount,
      authorsCount,
      articlesPublished,
      lastPublishedAt: latest?.publishedAt ?? null,
      pagesCount,
      pagesPublished,
      articleRevisionsCount,
      pageRevisionsCount,
    };
  }

  private async community({
    from,
    to,
  }: StatsWindow): Promise<MediumCommunityStats> {
    const now = new Date();

    const [
      commentsPublished,
      commentsPendingModeration,
      activePolls,
      pollVotes,
    ] = await Promise.all([
      this.prisma.comment.count({
        where: { state: 'approved', createdAt: { gte: from, lte: to } },
      }),
      this.prisma.comment.count({ where: { state: 'pendingApproval' } }),
      this.prisma.poll.count({
        where: {
          opensAt: { lte: now },
          OR: [{ closedAt: null }, { closedAt: { gt: now } }],
        },
      }),
      this.prisma.pollVote.count({
        where: { createdAt: { gte: from, lte: to } },
      }),
    ]);

    return {
      commentsPublished,
      commentsPendingModeration,
      activePolls,
      pollVotes,
    };
  }

  private async mail({ from, to }: StatsWindow): Promise<MediumMailStats> {
    const [total, jobs, bounced, rejected, lastCampaign] = await Promise.all([
      // Every mail, not just the campaigns — see MediumMailStats.total.
      this.prisma.mailLog.count({
        where: { sentDate: { gte: from, lte: to } },
      }),
      this.prisma.mailSendJob.aggregate({
        where: { createdAt: { gte: from, lte: to } },
        _sum: { sentCount: true, failedCount: true },
      }),
      this.prisma.mailLog.count({
        where: { state: 'bounced', sentDate: { gte: from, lte: to } },
      }),
      this.prisma.mailLog.count({
        where: { state: 'rejected', sentDate: { gte: from, lte: to } },
      }),
      this.prisma.mailSendJob.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    return {
      total,
      sends: jobs._sum.sentCount ?? 0,
      failures: jobs._sum.failedCount ?? 0,
      bounced,
      rejected,
      lastCampaignAt: lastCampaign?.createdAt ?? null,
    };
  }

  private async accounts({
    from,
    to,
  }: StatsWindow): Promise<MediumAccountStats> {
    const adminRole = await this.prisma.userRole.findFirst({
      where: { name: 'Admin' },
      select: { id: true },
    });

    const now = new Date();

    const [
      usersTotal,
      usersWithRole,
      adminCount,
      activeSessions,
      recentLogins,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { NOT: { roleIDs: { isEmpty: true } } },
      }),
      adminRole ?
        this.prisma.user.count({ where: { roleIDs: { has: adminRole.id } } })
      : Promise.resolve(0),
      this.prisma.session.count({ where: { expiresAt: { gt: now } } }),
      this.prisma.session.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { userID: true },
        distinct: ['userID'],
      }),
    ]);

    return {
      usersTotal,
      usersWithRole,
      adminCount,
      activeSessions,
      usersLoggedIn: recentLogins.length,
    };
  }

  private async integrations(): Promise<MediumIntegrationsStats> {
    const [mailProviders, paymentProviders, syncProviders, analyticsProviders] =
      await Promise.all([
        this.prisma.settingMailProvider.count(),
        this.prisma.settingPaymentProvider.count(),
        this.prisma.settingSyncProvider.count(),
        this.prisma.settingAnalyticsProvider.count(),
      ]);

    return {
      mailProviders,
      paymentProviders,
      syncProviders,
      analyticsProviders,
    };
  }

  private async network(): Promise<MediumNetworkStats> {
    const [peersTotal, peersDisabled] = await Promise.all([
      this.prisma.peer.count(),
      this.prisma.peer.count({ where: { isDisabled: true } }),
    ]);

    return { peersTotal, peersDisabled };
  }

  private async currency(): Promise<string | null> {
    const latest = await this.prisma.invoice.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { currency: true },
    });

    return latest ? String(latest.currency) : null;
  }
}
