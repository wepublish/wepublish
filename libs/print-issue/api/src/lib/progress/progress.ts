import { zurichDate } from '../rules/dates';
import {
  chargedPeriod,
  deliveredIssues,
  entitledIssues,
  owedUntil,
  type QuotaConfig,
  type RuleDelivery,
  type RulePeriod,
  type RuleSubscription,
} from '../rules/entitlement';

/** A copy of an issue the subscription received: a list handed to the printshop. */
export type ReceivedIssue = RuleDelivery & {
  /** as the medium writes it: «6.26», «#117» */
  label: string;
  /** the ship day, YYYY-MM-DD */
  issueDate: string;
  /** 0 = the print list, n = Nachlieferung n */
  batch: number;
  /** when the list went to the printshop */
  deliveredAt: string;
};

export type ProgressSubscription = Omit<RuleSubscription, 'deliveries'> & {
  deliveries: ReceivedIssue[];
};

export type PrintIssueProgressView = {
  subscriptionId: string;
  /** the period counted: the running one, else the latest paid one */
  periodId: string;
  /** copies received in that period, historic issues inside it included */
  received: number;
  /** what the period is worth; null = unlimited (lifetime) */
  entitled: number | null;
  /** still to send: entitled − received, never below 0 */
  owed: number;
  /** running, or ended and still owed copies within the time of two issues */
  relevant: boolean;
  /** the copies of that period, in the order they were shipped */
  issues: ReceivedIssue[];
};

const latestPaid = (periods: RulePeriod[]) =>
  periods
    .filter(period => period.paid)
    .reduce<RulePeriod | undefined>(
      (latest, period) =>
        !latest || period.endsAt > latest.endsAt ? period : latest,
      undefined
    );

/**
 * How many of the printed issues a subscription paid for it received, by the
 * same rules the print export counts with: the running period (else the
 * latest paid one), its share of the issues per year or the plan's number,
 * copies of lists handed over plus historic issues inside it. Null where
 * nothing is promised: no subscription, no period, or 0 printed issues.
 */
export function printIssueProgress(
  sub: ProgressSubscription,
  quota: QuotaConfig,
  today: string
): PrintIssueProgressView | null {
  if (sub.memberPlan.productType !== 'Subscription') {
    return null;
  }

  const deactivatedOn =
    sub.deactivation ? zurichDate(sub.deactivation.date) : null;
  const paidUntil = sub.paidUntil ? zurichDate(sub.paidUntil) : null;
  const running =
    (deactivatedOn === null || deactivatedOn > today) &&
    ((paidUntil !== null && paidUntil >= today) || sub.autoRenew);

  const period =
    running ?
      (chargedPeriod(sub.periods, today) ?? latestPaid(sub.periods))
    : latestPaid(sub.periods);

  if (!period) {
    return null;
  }

  const entitled = entitledIssues(period, sub.memberPlan, quota.issuesPerYear);

  if (entitled === 0) {
    return null;
  }

  const received = deliveredIssues(sub, period, quota.historicIssues);
  const owed = entitled === null ? 0 : Math.max(0, entitled - received);
  const stillOwed =
    owed > 0 &&
    quota.issuesPerYear > 0 &&
    today <= owedUntil(period, quota.issuesPerYear);

  return {
    subscriptionId: sub.id,
    periodId: period.id,
    received,
    entitled,
    owed,
    relevant: running || stillOwed,
    issues: sub.deliveries
      .filter(delivery => delivery.periodId === period.id)
      .sort((a, b) => a.issueDate.localeCompare(b.issueDate)),
  };
}
