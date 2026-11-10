import { formatDe, zurichDate } from './dates';

export type Periodicity =
  'monthly' | 'quarterly' | 'biannual' | 'yearly' | 'biennial' | 'lifetime';

/** A subscription period with the state of its invoice. */
export type RulePeriod = {
  id: string;
  startsAt: string;
  endsAt: string;
  paymentPeriodicity: Periodicity | string;
  /** invoice paid and not canceled */
  paid: boolean;
  invoiceId: string;
};

/** A copy of a finalized issue this subscription received, and the period it was charged to. */
export type RuleDelivery = {
  periodId: string | null;
  /** how many issues the copy counts as: 2 for a double issue; default 1 */
  countsAs?: number;
};

export type RuleIssue = {
  issueDate: string;
  /** how many issues it counts as against a period: 2 for a double issue; default 1 */
  countsAs?: number;
};

const weight = (entry: { countsAs?: number }) => entry.countsAs ?? 1;

/**
 * «Restexemplar 5/6»; a double issue owed after 5 of 6 covers two copies:
 * «Restexemplar 6–7/6». It goes out whole, even to a reader owed one copy.
 */
export function restexemplar(
  delivered: number,
  entitled: number | null,
  countsAs = 1
): string {
  const last = delivered + countsAs;
  const copies = last > delivered + 1 ? `${delivered + 1}–${last}` : `${last}`;

  return `Restexemplar ${copies}/${entitled ?? '∞'}`;
}

export type RuleSubscription = {
  id: string;
  userId: string;
  startsAt: string;
  paidUntil: string | null;
  autoRenew: boolean;
  deactivation: { date: string; reason?: string | null } | null;
  memberPlan: {
    id?: string;
    productType: string;
    printIssues?: PrintIssuesByPeriodicity;
  };
  periods: RulePeriod[];
  /** invoices neither paid nor canceled */
  openInvoiceIds: string[];
  deliveries: RuleDelivery[];
};

export type QuotaConfig = {
  /** 0 switches the owed-copies rule off */
  issuesPerYear: number;
  /** issues shipped before the export tracked them: presumed delivered */
  historicIssues: RuleIssue[];
};

export type RuleOptions = {
  /** subscriptions starting after the ship day get a copy as a gift */
  includeUpcoming?: boolean;
  /** renewing readers whose invoice is not paid yet stay in («offen»); default true */
  includeOpen?: boolean;
  /** only these member plans; null or undefined = every subscription plan */
  memberPlanIds?: string[] | null;
};

export type IncludeReason = 'paid' | 'openInvoice' | 'grace' | 'gift';
export type ExclusionReason =
  | 'donation'
  | 'excludedPlan'
  | 'future'
  | 'unpaidDeactivation'
  | 'replaced'
  | 'deactivated'
  | 'lapsed'
  | 'exhausted'
  | 'noPrintIssues';

export type Included = {
  include: true;
  reason: IncludeReason;
  zahlungsstatus: string;
  unpaid: boolean;
  /** the paid period the copy is charged to; null for a gift */
  periodId: string | null;
  /** renews, but no renewal invoice exists yet */
  openWithoutInvoice: boolean;
};

export type Excluded = { include: false; reason: ExclusionReason };

export type Verdict = Included | Excluded;

const NO_QUOTA: QuotaConfig = { issuesPerYear: 0, historicIssues: [] };

const MONTHS: Record<string, number | null> = {
  monthly: 1,
  quarterly: 3,
  biannual: 6,
  yearly: 12,
  biennial: 24,
  lifetime: null,
};

/** The reader did not pay: the period earns no copies. */
const UNPAID_REASONS = new Set(['invoiceNotPaid', 'chargeback']);

const excluded = (reason: ExclusionReason): Excluded => ({
  include: false,
  reason,
});

const included = (
  reason: IncludeReason,
  zahlungsstatus: string,
  unpaid: boolean,
  periodId: string | null,
  openWithoutInvoice = false
): Included => ({
  include: true,
  reason,
  zahlungsstatus,
  unpaid,
  periodId,
  openWithoutInvoice,
});

const latestEnding = (periods: RulePeriod[]): RulePeriod | undefined =>
  periods.reduce<RulePeriod | undefined>(
    (latest, period) =>
      !latest || period.endsAt > latest.endsAt ? period : latest,
    undefined
  );

/** The period a copy shipped on `day` belongs to: the one covering it, paid preferred, else the latest that had started. */
export function chargedPeriod(
  periods: RulePeriod[],
  day: string
): RulePeriod | undefined {
  const covering = periods.filter(
    period =>
      zurichDate(period.startsAt) <= day && day <= zurichDate(period.endsAt)
  );
  const paidCovering = covering.filter(period => period.paid);

  return (
    latestEnding(paidCovering) ??
    latestEnding(covering) ??
    latestEnding(periods.filter(period => zurichDate(period.startsAt) <= day))
  );
}

/** Printed issues a plan sets per periodicity; a periodicity left out follows the formula. */
export type PrintIssuesByPeriodicity = Partial<Record<string, number>>;

/**
 * How many issues one period is worth; null = unlimited (lifetime). The
 * plan's number for the period's periodicity wins, else the medium's issues
 * per year pro rata. It counts only once the period is over: a paid period
 * receives every issue shipped inside it.
 */
export function entitledIssues(
  period: RulePeriod,
  plan: { printIssues?: PrintIssuesByPeriodicity },
  issuesPerYear: number
): number | null {
  const set = plan.printIssues?.[period.paymentPeriodicity];

  if (set != null) {
    return set;
  }

  const months = MONTHS[period.paymentPeriodicity] ?? null;

  return months === null ? null : Math.round((issuesPerYear * months) / 12);
}

/**
 * Issues the period already got: the tracked copies charged to it, plus every
 * historic issue shipped inside it (the baseline from before tracking).
 */
export function deliveredIssues(
  sub: RuleSubscription,
  period: RulePeriod,
  historicIssues: RuleIssue[]
): number {
  const from = zurichDate(period.startsAt);
  const to = zurichDate(period.endsAt);
  const tracked = sub.deliveries
    .filter(delivery => delivery.periodId === period.id)
    .reduce((sum, delivery) => sum + weight(delivery), 0);
  const presumed = historicIssues
    .filter(issue => from <= issue.issueDate && issue.issueDate <= to)
    .reduce((sum, issue) => sum + weight(issue), 0);

  return tracked + presumed;
}

/**
 * Whether a subscription receives the issue shipped on `issue.issueDate`
 * (a Zurich calendar day). Paid-up subscriptions do, renewing ones stay in
 * the run until the dunning process deactivates them, and a subscription
 * whose paid period is over still gets the copies that period is worth.
 */
export function classifySubscription(
  sub: RuleSubscription,
  issue: RuleIssue,
  quota: QuotaConfig = NO_QUOTA,
  options: RuleOptions = {}
): Verdict {
  const day = issue.issueDate;

  if (sub.memberPlan.productType !== 'Subscription') {
    return excluded('donation');
  }

  if (
    options.memberPlanIds &&
    !options.memberPlanIds.includes(sub.memberPlan.id ?? '')
  ) {
    return excluded('excludedPlan');
  }

  // a periodicity the plan sets to 0 receives nothing: paid, open, gift or owed
  const current = chargedPeriod(sub.periods, day) ?? latestEnding(sub.periods);

  if (
    current &&
    sub.memberPlan.printIssues?.[current.paymentPeriodicity] === 0
  ) {
    return excluded('noPrintIssues');
  }

  const startsOn = zurichDate(sub.startsAt);
  const paidUntil = sub.paidUntil ? zurichDate(sub.paidUntil) : null;

  if (startsOn > day) {
    if (
      options.includeUpcoming &&
      !sub.deactivation &&
      (paidUntil !== null || sub.autoRenew)
    ) {
      return included(
        'gift',
        `Vorab-Exemplar, Abo ab ${formatDe(startsOn)}`,
        paidUntil === null,
        null
      );
    }

    return excluded('future');
  }

  const deactivatedOn =
    sub.deactivation ? zurichDate(sub.deactivation.date) : null;
  const ended = deactivatedOn !== null && deactivatedOn <= day;

  if (ended) {
    const reason = sub.deactivation?.reason ?? 'none';

    if (UNPAID_REASONS.has(reason)) {
      return excluded('unpaidDeactivation');
    }

    if (reason === 'userReplacedSubscription') {
      return excluded('replaced');
    }
  } else {
    if (paidUntil !== null && paidUntil >= day) {
      return included(
        'paid',
        deactivatedOn ?
          `Kündigung per ${formatDe(deactivatedOn)}`
        : `bezahlt bis ${formatDe(paidUntil)}`,
        false,
        chargedPeriod(sub.periods, day)?.id ?? null
      );
    }

    if (sub.autoRenew && options.includeOpen !== false) {
      const openPeriod = latestEnding(
        sub.periods.filter(period =>
          sub.openInvoiceIds.includes(period.invoiceId)
        )
      );

      return included(
        'openInvoice',
        'offen',
        true,
        (openPeriod ?? chargedPeriod(sub.periods, day))?.id ?? null,
        sub.openInvoiceIds.length === 0
      );
    }
  }

  if (quota.issuesPerYear > 0) {
    const period = latestEnding(sub.periods.filter(period => period.paid));

    if (period) {
      const entitled = entitledIssues(
        period,
        sub.memberPlan,
        quota.issuesPerYear
      );
      const delivered = deliveredIssues(sub, period, quota.historicIssues);

      if (entitled === null || delivered < entitled) {
        return included(
          'grace',
          restexemplar(delivered, entitled, weight(issue)),
          false,
          period.id
        );
      }

      return excluded('exhausted');
    }
  }

  return excluded(ended ? 'deactivated' : 'lapsed');
}

type GiftEntry = {
  subscription: { id: string; userId: string; startsAt: string };
  verdict: Verdict;
};

/**
 * A gift goes to readers who get no copy otherwise, one per reader: the
 * subscription starting first. Every other gift candidate is a plain `future`.
 */
export function resolveGifts<T extends GiftEntry>(entries: T[]): T[] {
  const isGift = (entry: GiftEntry) =>
    entry.verdict.include && entry.verdict.reason === 'gift';
  const served = new Set(
    entries
      .filter(entry => entry.verdict.include && !isGift(entry))
      .map(entry => entry.subscription.userId)
  );
  const chosen = new Map<string, T>();

  for (const entry of entries) {
    const { userId, startsAt } = entry.subscription;

    if (!isGift(entry) || served.has(userId)) {
      continue;
    }

    const current = chosen.get(userId);

    if (
      !current ||
      zurichDate(startsAt) < zurichDate(current.subscription.startsAt)
    ) {
      chosen.set(userId, entry);
    }
  }

  return entries.map(entry =>
    isGift(entry) && chosen.get(entry.subscription.userId) !== entry ?
      { ...entry, verdict: excluded('future') }
    : entry
  );
}
