import type { PrismaClient } from '@prisma/client';
import type { Members, Property, Subscription, User } from './types';

/** Users are read in batches of this size, so no query carries a huge IN list. */
export const USER_BATCH = 1000;

const iso = (date: Date | null | undefined) =>
  date ? date.toISOString() : null;

/** The plan with its printed issues per periodicity; unset periodicities are left out. */
const memberPlanOf = ({
  periodicityPricing,
  ...plan
}: {
  id: string;
  slug: string;
  name: string;
  productType: string;
  periodicityPricing: { periodicity: string; printIssues: number | null }[];
}) => ({
  ...plan,
  printIssues: Object.fromEntries(
    periodicityPricing
      .filter(price => price.printIssues != null)
      .map(price => [price.periodicity, price.printIssues as number])
  ),
});

/** Stored properties carry a `public` flag; the export reads all of them. */
const propertiesOf = (raw: unknown): Property[] =>
  Array.isArray(raw) ?
    raw
      .filter(
        (entry): entry is { key: unknown; value: unknown } =>
          typeof entry === 'object' && entry !== null
      )
      .map(({ key, value }) => ({ key: String(key), value: String(value) }))
  : [];

/**
 * Every subscription with its plan, deactivation, periods (and whether their
 * invoice is paid), open invoices and the copies of finalized issues it got,
 * plus the users they belong to — read straight from the database: the export
 * decides who receives a copy, so it must not depend on what an API token
 * happens to be allowed to see.
 */
export async function loadMembers(prisma: PrismaClient): Promise<Members> {
  const rows = await prisma.subscription.findMany({
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      startsAt: true,
      paidUntil: true,
      autoRenew: true,
      properties: true,
      userID: true,
      deactivation: { select: { date: true, reason: true } },
      memberPlan: {
        select: {
          id: true,
          slug: true,
          name: true,
          productType: true,
          periodicityPricing: {
            select: { periodicity: true, printIssues: true },
          },
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
        select: { periodId: true },
      },
    },
  });

  const subscriptions: Subscription[] = rows.map(row => ({
    id: row.id,
    userId: row.userID,
    startsAt: row.startsAt.toISOString(),
    paidUntil: iso(row.paidUntil),
    autoRenew: row.autoRenew,
    deactivation:
      row.deactivation ?
        {
          date: row.deactivation.date.toISOString(),
          reason: row.deactivation.reason,
        }
      : null,
    memberPlan: memberPlanOf(row.memberPlan),
    properties: propertiesOf(row.properties),
    periods: row.periods.map(period => ({
      id: period.id,
      startsAt: period.startsAt.toISOString(),
      endsAt: period.endsAt.toISOString(),
      paymentPeriodicity: period.paymentPeriodicity,
      paid:
        period.invoice.paidAt !== null && period.invoice.canceledAt === null,
      invoiceId: period.invoiceID,
    })),
    openInvoiceIds: row.invoices.map(invoice => invoice.id),
    deliveries: row.printDeliveries.map(delivery => ({
      periodId: delivery.periodId,
    })),
  }));

  const userIds = [...new Set(rows.map(row => row.userID))];
  const users = new Map<string, User>();

  for (let i = 0; i < userIds.length; i += USER_BATCH) {
    const batch = await prisma.user.findMany({
      where: { id: { in: userIds.slice(i, i + USER_BATCH) } },
      select: {
        id: true,
        email: true,
        firstName: true,
        name: true,
        properties: true,
        address: {
          select: {
            company: true,
            streetAddress: true,
            streetAddressNumber: true,
            streetAddress2: true,
            streetAddress2Number: true,
            zipCode: true,
            city: true,
            country: true,
          },
        },
      },
    });

    for (const user of batch) {
      users.set(user.id, {
        ...user,
        address: user.address ?? null,
        properties: propertiesOf(user.properties),
      });
    }
  }

  const withoutUser = subscriptions.filter(
    subscription => !users.has(subscription.userId)
  ).length;

  return {
    subscriptions,
    users,
    warnings: withoutUser ? [`${withoutUser} Abo(s) ohne Benutzer`] : [],
  };
}
