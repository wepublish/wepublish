import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { memberPlanOf } from '../members/load';
import { readIssueNumbering } from '../numbering-setting';
import { readQuota } from '../quota-setting';
import { dbDateToYmd, todayZurich } from '../rules/dates';
import { issueLabel } from '../rules/issue';
import {
  printIssueProgress,
  type PrintIssueProgressView,
  type ProgressSubscription,
} from './progress';

const SELECT = {
  id: true,
  userID: true,
  startsAt: true,
  paidUntil: true,
  autoRenew: true,
  deactivation: { select: { date: true, reason: true } },
  memberPlan: {
    select: {
      id: true,
      slug: true,
      name: true,
      productType: true,
      periodicityPricing: { select: { periodicity: true, printIssues: true } },
    },
  },
  periods: {
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      paymentPeriodicity: true,
      invoiceID: true,
      invoice: { select: { paidAt: true, canceledAt: true } },
    },
  },
  invoices: {
    where: { paidAt: null, canceledAt: null },
    select: { id: true },
  },
  // only copies whose list was handed to the printshop count as received
  printDeliveries: {
    where: { delivery: { deliveredAt: { not: null } } },
    select: {
      periodId: true,
      batch: true,
      issue: {
        select: {
          number: true,
          numberTo: true,
          year: true,
          countsAs: true,
          issueDate: true,
        },
      },
      delivery: { select: { deliveredAt: true } },
    },
  },
} satisfies Prisma.SubscriptionSelect;

/**
 * How many of the printed issues readers paid for they received, for the
 * editor's user list and user view. Same rules as the print export.
 */
@Injectable()
export class PrintIssueProgressService {
  constructor(private prisma: PrismaClient) {}

  /** Per subscription; null where nothing is promised. */
  async forSubscriptions(
    ids: readonly string[]
  ): Promise<Map<string, PrintIssueProgressView | null>> {
    const progress = await this.load({ id: { in: [...ids] } });

    return new Map(
      ids.map(id => [
        id,
        progress.find(entry => entry.subscription.id === id)?.view ?? null,
      ])
    );
  }

  /** Per user: the subscriptions with something to count. */
  async forUsers(
    userIds: readonly string[]
  ): Promise<Map<string, PrintIssueProgressView[]>> {
    const progress = await this.load({ userID: { in: [...userIds] } });

    return new Map(
      userIds.map(userId => [
        userId,
        progress
          .filter(entry => entry.subscription.userId === userId && entry.view)
          .map(entry => entry.view!),
      ])
    );
  }

  /**
   * Per user: copies still to send, over their subscriptions that are running
   * or still owed copies; null for a user without printed issues.
   */
  async owedByUser(
    userIds: readonly string[]
  ): Promise<Map<string, number | null>> {
    const byUser = await this.forUsers(userIds);

    return new Map(
      [...byUser].map(([userId, views]) => [
        userId,
        views.length ?
          views
            .filter(view => view.relevant)
            .reduce((sum, view) => sum + view.owed, 0)
        : null,
      ])
    );
  }

  /**
   * The users the filter matches, by copies still owed: in the given order,
   * users without printed issues last, ties by id. For sorting the user list.
   */
  async usersByOwed(
    where: Prisma.UserWhereInput,
    order: 'asc' | 'desc'
  ): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where,
      select: { id: true },
    });
    const owed = await this.owedByUser(users.map(user => user.id));
    const direction = order === 'asc' ? 1 : -1;

    return [...owed]
      .sort(([idA, a], [idB, b]) => {
        if (a === null || b === null) {
          return a === b ? idA.localeCompare(idB) : a === null ? 1 : -1;
        }

        return (a - b) * direction || idA.localeCompare(idB);
      })
      .map(([id]) => id);
  }

  private async load(where: Prisma.SubscriptionWhereInput) {
    const [rows, quota, numbering] = await Promise.all([
      this.prisma.subscription.findMany({ where, select: SELECT }),
      readQuota(this.prisma),
      readIssueNumbering(this.prisma),
    ]);
    const today = todayZurich();

    return rows.map(row => {
      const subscription: ProgressSubscription = {
        id: row.id,
        userId: row.userID,
        startsAt: row.startsAt.toISOString(),
        paidUntil: row.paidUntil?.toISOString() ?? null,
        autoRenew: row.autoRenew,
        deactivation:
          row.deactivation ?
            {
              date: row.deactivation.date.toISOString(),
              reason: row.deactivation.reason,
            }
          : null,
        memberPlan: memberPlanOf(row.memberPlan),
        periods: row.periods.map(period => ({
          id: period.id,
          startsAt: period.startsAt.toISOString(),
          endsAt: period.endsAt.toISOString(),
          paymentPeriodicity: period.paymentPeriodicity,
          paid:
            period.invoice.paidAt !== null &&
            period.invoice.canceledAt === null,
          invoiceId: period.invoiceID,
        })),
        openInvoiceIds: row.invoices.map(invoice => invoice.id),
        deliveries: row.printDeliveries.map(delivery => ({
          periodId: delivery.periodId,
          countsAs: delivery.issue.countsAs,
          label: issueLabel(delivery.issue, numbering),
          issueDate: dbDateToYmd(delivery.issue.issueDate),
          batch: delivery.batch,
          deliveredAt: delivery.delivery.deliveredAt!.toISOString(),
        })),
      };

      return {
        subscription,
        view: printIssueProgress(subscription, quota, today),
      };
    });
  }
}
