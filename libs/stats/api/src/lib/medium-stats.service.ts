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
  MediumEditorialStats,
  MediumIntegrationsStats,
  MediumNetworkStats,
  MediumMailStats,
  MediumMembershipStats,
  MediumMoneyStats,
  MediumOperationsStats,
  MediumStats,
} from './medium-stats.model';

/** Hard cap on how many migration rows one call may return. */
export const MIGRATION_LIST_LIMIT = 200;

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

  private async operations(): Promise<MediumOperationsStats> {
    const [job, images, documents, mailchimpSyncErrors, migrations] =
      await Promise.all([
        this.prisma.periodicJob.findFirst({ orderBy: { date: 'desc' } }),
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
      ]);

    const imageBytes = images._sum.fileSize ?? 0;
    const documentBytes = documents._sum.fileSize ?? 0;

    return {
      lastPeriodicJobAt: job?.executionTime ?? null,
      periodicJobFailing: Boolean(job?.finishedWithError),
      periodicJobError: job?.error ?? null,
      periodicJobTries: job?.tries ?? 0,
      imageCount: images._count._all,
      imageBytes,
      documentCount: documents._count._all,
      documentBytes,
      storageBytes: imageBytes + documentBytes,
      mailchimpSyncErrors,
      migrations,
    };
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
    const [jobs, bounced, rejected, lastCampaign] = await Promise.all([
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
