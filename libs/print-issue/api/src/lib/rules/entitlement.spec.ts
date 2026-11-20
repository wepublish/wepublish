import {
  classifySubscription,
  deliveredIssues,
  entitledIssues,
  owedWindowMonths,
  resolveGifts,
  type QuotaConfig,
  type RulePeriod,
  type RuleSubscription,
} from './entitlement';

// issue 6.26, shipped 13.10.2026
const ISSUE = { issueDate: '2026-10-13' };

const period = (overrides: Partial<RulePeriod> = {}): RulePeriod => ({
  id: 'p2026',
  startsAt: '2026-01-01T00:00:00.000Z',
  endsAt: '2026-12-31T00:00:00.000Z',
  paymentPeriodicity: 'yearly',
  paid: true,
  invoiceId: 'i2026',
  ...overrides,
});

const subscription = (
  overrides: Partial<RuleSubscription> = {}
): RuleSubscription => ({
  id: 's1',
  userId: 'u1',
  startsAt: '2024-01-01T00:00:00.000Z',
  paidUntil: '2026-12-31T00:00:00.000Z',
  autoRenew: true,
  deactivation: null,
  memberPlan: { productType: 'Subscription' },
  periods: [period()],
  openInvoiceIds: [],
  deliveries: [],
  ...overrides,
});

const NO_QUOTA: QuotaConfig = { issuesPerYear: 0, historicIssues: [] };
const QUOTA_6: QuotaConfig = { issuesPerYear: 6, historicIssues: [] };

// the six issues of 2026 as they were shipped before the export tracked them
const HISTORIC_2026 = [
  '2026-02-13',
  '2026-04-10',
  '2026-06-12',
  '2026-08-23',
  '2026-10-14',
  '2026-12-04',
].map(issueDate => ({ issueDate }));

describe('classifySubscription — the rules the Worker had', () => {
  it('includes a paid-up subscription with its paid-until day, charged to the covering period', () => {
    expect(classifySubscription(subscription(), ISSUE, NO_QUOTA)).toEqual({
      include: true,
      reason: 'paid',
      zahlungsstatus: 'bezahlt bis 31.12.2026',
      unpaid: false,
      periodId: 'p2026',
      openWithoutInvoice: false,
    });
  });

  it('keeps a renewing subscription in the run as «offen» and charges it to the open invoice', () => {
    const open = classifySubscription(
      subscription({
        paidUntil: '2026-09-30T00:00:00.000Z',
        periods: [
          period({
            id: 'p2025',
            startsAt: '2025-10-01T00:00:00.000Z',
            endsAt: '2026-09-30T00:00:00.000Z',
            invoiceId: 'i2025',
          }),
          period({
            id: 'p2026',
            startsAt: '2026-10-01T00:00:00.000Z',
            endsAt: '2027-09-30T00:00:00.000Z',
            invoiceId: 'i2026',
            paid: false,
          }),
        ],
        openInvoiceIds: ['i2026'],
      }),
      ISSUE,
      NO_QUOTA
    );

    expect(open).toEqual({
      include: true,
      reason: 'openInvoice',
      zahlungsstatus: 'offen',
      unpaid: true,
      periodId: 'p2026',
      openWithoutInvoice: false,
    });
  });

  it('keeps a renewing subscription without any invoice yet, and says so', () => {
    // an export evaluated at a ship day in the future runs before the nightly
    // job has created the renewal invoice
    const verdict = classifySubscription(
      subscription({ paidUntil: '2026-09-30T00:00:00.000Z' }),
      ISSUE,
      NO_QUOTA
    );

    expect(verdict).toMatchObject({
      include: true,
      reason: 'openInvoice',
      zahlungsstatus: 'offen',
      unpaid: true,
      openWithoutInvoice: true,
    });
    expect(
      classifySubscription(subscription({ paidUntil: null }), ISSUE, NO_QUOTA)
    ).toMatchObject({ include: true, unpaid: true });
  });

  it('drops a subscription deactivated on or before the day when nothing is owed', () => {
    expect(
      classifySubscription(
        subscription({ deactivation: { date: '2026-10-01T00:00:00.000Z' } }),
        ISSUE,
        NO_QUOTA
      )
    ).toEqual({ include: false, reason: 'deactivated' });
    expect(
      classifySubscription(
        subscription({ deactivation: { date: '2026-10-13T08:00:00.000Z' } }),
        ISSUE,
        NO_QUOTA
      )
    ).toEqual({ include: false, reason: 'deactivated' });
  });

  it('keeps a subscription whose deactivation lies ahead and says so', () => {
    expect(
      classifySubscription(
        subscription({ deactivation: { date: '2026-12-31T00:00:00.000Z' } }),
        ISSUE,
        NO_QUOTA
      )
    ).toMatchObject({
      include: true,
      reason: 'paid',
      zahlungsstatus: 'Kündigung per 31.12.2026',
      unpaid: false,
    });
  });

  it('drops a subscription that has not started yet, but keeps one starting that day', () => {
    expect(
      classifySubscription(
        subscription({ startsAt: '2026-11-01T00:00:00.000Z' }),
        ISSUE,
        NO_QUOTA
      )
    ).toEqual({ include: false, reason: 'future' });
    expect(
      classifySubscription(
        subscription({ startsAt: '2026-10-13T00:00:00.000Z' }),
        ISSUE,
        NO_QUOTA
      ).include
    ).toBe(true);
  });

  it('drops a lapsed trial when nothing is owed and keeps a running one', () => {
    const trial = { autoRenew: false };
    expect(
      classifySubscription(
        subscription({ ...trial, paidUntil: '2026-09-30T00:00:00.000Z' }),
        ISSUE,
        NO_QUOTA
      )
    ).toEqual({ include: false, reason: 'lapsed' });
    expect(
      classifySubscription(
        subscription({ ...trial, paidUntil: null }),
        ISSUE,
        NO_QUOTA
      )
    ).toEqual({ include: false, reason: 'lapsed' });
    expect(
      classifySubscription(
        subscription({ ...trial, paidUntil: '2026-12-31T00:00:00.000Z' }),
        ISSUE,
        NO_QUOTA
      ).include
    ).toBe(true);
  });

  it('includes a prepaid subscription beyond the year', () => {
    expect(
      classifySubscription(
        subscription({
          autoRenew: false,
          paidUntil: '2027-12-31T00:00:00.000Z',
        }),
        ISSUE,
        NO_QUOTA
      )
    ).toMatchObject({ zahlungsstatus: 'bezahlt bis 31.12.2027' });
  });

  it('drops donations', () => {
    expect(
      classifySubscription(
        subscription({ memberPlan: { productType: 'Donation' } }),
        ISSUE,
        NO_QUOTA
      )
    ).toEqual({ include: false, reason: 'donation' });
  });

  it('handles the year boundary in Zurich time', () => {
    expect(
      classifySubscription(
        subscription(),
        { issueDate: '2027-01-15' },
        NO_QUOTA
      )
    ).toMatchObject({ include: true, zahlungsstatus: 'offen', unpaid: true });
    // 23:30 UTC on the 31st is already 1 January in Zurich
    const lateNight = subscription({ paidUntil: '2026-12-31T23:30:00.000Z' });
    expect(
      classifySubscription(lateNight, { issueDate: '2026-12-31' }, NO_QUOTA)
    ).toMatchObject({ zahlungsstatus: 'bezahlt bis 01.01.2027' });
    expect(
      classifySubscription(lateNight, { issueDate: '2027-01-02' }, NO_QUOTA)
    ).toMatchObject({ zahlungsstatus: 'offen' });
  });

  it('charges a paid copy to the latest period that started when none covers the day', () => {
    expect(
      classifySubscription(
        subscription({
          paidUntil: '2027-12-31T00:00:00.000Z',
          periods: [
            period({
              id: 'p2025',
              startsAt: '2025-01-01T00:00:00.000Z',
              endsAt: '2025-12-31T00:00:00.000Z',
            }),
          ],
        }),
        ISSUE,
        NO_QUOTA
      )
    ).toMatchObject({ periodId: 'p2025' });
    expect(
      classifySubscription(subscription({ periods: [] }), ISSUE, NO_QUOTA)
    ).toMatchObject({ periodId: null });
  });
});

describe('owedWindowMonths', () => {
  it('is the time of two issues, at least a month', () => {
    expect(owedWindowMonths(6)).toBe(4);
    expect(owedWindowMonths(4)).toBe(6);
    expect(owedWindowMonths(12)).toBe(2);
    expect(owedWindowMonths(52)).toBe(1);
  });
});

describe('classifySubscription — copies still owed (grace)', () => {
  const trialPlan = {
    productType: 'Subscription',
    printIssues: { quarterly: 3 },
  };
  const trial = (deliveries: RuleSubscription['deliveries'] = []) =>
    subscription({
      memberPlan: trialPlan,
      startsAt: '2026-09-01T00:00:00.000Z',
      paidUntil: '2026-11-30T00:00:00.000Z',
      autoRenew: false,
      // the nightly job deactivates a lapsed trial this way
      deactivation: {
        date: '2026-11-30T00:00:00.000Z',
        reason: 'userSelfDeactivated',
      },
      periods: [
        period({
          id: 'pt',
          startsAt: '2026-09-01T00:00:00.000Z',
          endsAt: '2026-11-30T00:00:00.000Z',
          paymentPeriodicity: 'quarterly',
          invoiceId: 'it',
        }),
      ],
      deliveries,
    });
  const quota: QuotaConfig = {
    issuesPerYear: 6,
    historicIssues: HISTORIC_2026,
  };
  const issue127 = { issueDate: '2027-01-15' };
  const issue227 = { issueDate: '2027-03-15' };
  const issue327 = { issueDate: '2027-05-15' };

  it('gives a lapsed Probeabo its three issues: one historic, then two tracked', () => {
    expect(classifySubscription(trial(), issue127, quota)).toEqual({
      include: true,
      reason: 'grace',
      zahlungsstatus: 'Restexemplar 2/3',
      unpaid: false,
      periodId: 'pt',
      openWithoutInvoice: false,
    });
    expect(
      classifySubscription(trial([{ periodId: 'pt' }]), issue227, quota)
    ).toMatchObject({ reason: 'grace', zahlungsstatus: 'Restexemplar 3/3' });
    expect(
      classifySubscription(
        trial([{ periodId: 'pt' }, { periodId: 'pt' }]),
        issue327,
        quota
      )
    ).toEqual({ include: false, reason: 'exhausted' });
  });

  it('presumes a yearly 2026 non-renewer delivered when every 2026 issue is historic', () => {
    const lapsed = subscription({
      autoRenew: false,
      deactivation: {
        date: '2026-12-31T00:00:00.000Z',
        reason: 'userSelfDeactivated',
      },
    });
    expect(classifySubscription(lapsed, issue127, quota)).toEqual({
      include: false,
      reason: 'exhausted',
    });
    expect(
      classifySubscription(lapsed, issue127, {
        issuesPerYear: 6,
        historicIssues: HISTORIC_2026.slice(0, 5),
      })
    ).toMatchObject({ reason: 'grace', zahlungsstatus: 'Restexemplar 6/6' });
  });

  it('stops owing copies once the time of two issues after the period has passed', () => {
    // a reader who stopped in 2019: nothing is recorded for that period, and
    // nothing is owed any more – the subscription is simply over
    const gone = subscription({
      startsAt: '2015-01-01T00:00:00.000Z',
      paidUntil: '2019-12-31T00:00:00.000Z',
      autoRenew: false,
      deactivation: {
        date: '2019-12-31T00:00:00.000Z',
        reason: 'userSelfDeactivated',
      },
      periods: [
        period({
          id: 'p2019',
          startsAt: '2019-01-01T00:00:00.000Z',
          endsAt: '2019-12-31T00:00:00.000Z',
          invoiceId: 'i2019',
        }),
      ],
    });
    expect(classifySubscription(gone, issue127, quota)).toEqual({
      include: false,
      reason: 'deactivated',
    });

    // six issues a year: the right ends four months after the period
    const lapsed = (endsAt: string) =>
      subscription({
        paidUntil: endsAt,
        autoRenew: false,
        periods: [period({ endsAt })],
      });
    expect(
      classifySubscription(
        lapsed('2026-07-31T00:00:00.000Z'),
        issue127,
        QUOTA_6
      )
    ).toEqual({ include: false, reason: 'lapsed' });
    expect(
      classifySubscription(
        lapsed('2026-09-30T00:00:00.000Z'),
        issue127,
        QUOTA_6
      )
    ).toMatchObject({ reason: 'grace', zahlungsstatus: 'Restexemplar 1/6' });
    // four issues a year: six months
    expect(
      classifySubscription(lapsed('2026-07-31T00:00:00.000Z'), issue127, {
        ...QUOTA_6,
        issuesPerYear: 4,
      })
    ).toMatchObject({ reason: 'grace', zahlungsstatus: 'Restexemplar 1/4' });
  });

  it('adds tracked rows of the period to the historic ones', () => {
    const lapsed = subscription({
      autoRenew: false,
      deactivation: {
        date: '2026-12-31T00:00:00.000Z',
        reason: 'userSelfDeactivated',
      },
      deliveries: [{ periodId: 'p2026' }],
    });
    expect(
      classifySubscription(lapsed, issue127, {
        issuesPerYear: 6,
        historicIssues: HISTORIC_2026.slice(0, 5),
      })
    ).toEqual({ include: false, reason: 'exhausted' });
  });

  it('sends a double issue to a reader owed one copy, and says it covers two', () => {
    expect(
      classifySubscription(
        trial([{ periodId: 'pt' }]),
        { ...issue227, countsAs: 2 },
        quota
      )
    ).toMatchObject({
      include: true,
      reason: 'grace',
      zahlungsstatus: 'Restexemplar 3–4/3',
    });
  });

  it('counts a delivered double issue as two received copies', () => {
    expect(
      classifySubscription(
        trial([{ periodId: 'pt', countsAs: 2 }]),
        issue227,
        quota
      )
    ).toEqual({ include: false, reason: 'exhausted' });
  });

  it('still owes copies to a reader who cancelled at once but paid the period', () => {
    const cancelled = subscription({
      deactivation: {
        date: '2026-10-01T00:00:00.000Z',
        reason: 'userSelfDeactivated',
      },
    });
    expect(
      classifySubscription(cancelled, ISSUE, {
        issuesPerYear: 6,
        historicIssues: HISTORIC_2026.slice(0, 4),
      })
    ).toMatchObject({
      reason: 'grace',
      zahlungsstatus: 'Restexemplar 5/6',
      periodId: 'p2026',
    });
  });

  it('never owes copies after an unpaid deactivation or a replacement', () => {
    for (const reason of ['invoiceNotPaid', 'chargeback']) {
      expect(
        classifySubscription(
          subscription({
            deactivation: { date: '2026-10-01T00:00:00.000Z', reason },
          }),
          ISSUE,
          quota
        )
      ).toEqual({ include: false, reason: 'unpaidDeactivation' });
    }
    expect(
      classifySubscription(
        subscription({
          deactivation: {
            date: '2026-10-01T00:00:00.000Z',
            reason: 'userReplacedSubscription',
          },
        }),
        ISSUE,
        quota
      )
    ).toEqual({ include: false, reason: 'replaced' });
  });

  it('only counts paid periods', () => {
    const lapsed = subscription({
      autoRenew: false,
      paidUntil: null,
      deactivation: {
        date: '2026-12-31T00:00:00.000Z',
        reason: 'userSelfDeactivated',
      },
      periods: [period({ paid: false })],
    });
    expect(classifySubscription(lapsed, issue127, QUOTA_6)).toEqual({
      include: false,
      reason: 'deactivated',
    });
  });

  it('owes nothing while the quota is switched off', () => {
    expect(
      classifySubscription(trial(), issue127, { ...quota, issuesPerYear: 0 })
    ).toEqual({
      include: false,
      reason: 'deactivated',
    });
  });
});

describe('entitledIssues', () => {
  it('derives the copies of a period from the issues per year', () => {
    const plan = { printIssues: {} };
    expect(
      entitledIssues(period({ paymentPeriodicity: 'monthly' }), plan, 6)
    ).toBe(1);
    expect(
      entitledIssues(period({ paymentPeriodicity: 'quarterly' }), plan, 6)
    ).toBe(2);
    expect(
      entitledIssues(period({ paymentPeriodicity: 'biannual' }), plan, 6)
    ).toBe(3);
    expect(
      entitledIssues(period({ paymentPeriodicity: 'yearly' }), plan, 6)
    ).toBe(6);
    expect(
      entitledIssues(period({ paymentPeriodicity: 'biennial' }), plan, 6)
    ).toBe(12);
    expect(
      entitledIssues(period({ paymentPeriodicity: 'lifetime' }), plan, 6)
    ).toBeNull();
  });

  it("takes the number the plan sets for the period's periodicity, the formula for the others", () => {
    const plan = { printIssues: { yearly: 2, lifetime: 4 } };

    expect(entitledIssues(period(), plan, 6)).toBe(2);
    expect(
      entitledIssues(period({ paymentPeriodicity: 'lifetime' }), plan, 6)
    ).toBe(4);
    // nothing set for monthly: 6 issues a year, pro rata
    expect(
      entitledIssues(period({ paymentPeriodicity: 'monthly' }), plan, 6)
    ).toBe(1);
  });

  it('accepts 0 as «no copies» for a periodicity', () => {
    expect(entitledIssues(period(), { printIssues: { yearly: 0 } }, 6)).toBe(0);
  });

  it('works for a plan without any number', () => {
    expect(entitledIssues(period(), {}, 6)).toBe(6);
  });
});

describe('deliveredIssues', () => {
  it('counts tracked rows of the period and historic issues inside it, ignoring gifts', () => {
    const sub = subscription({
      deliveries: [
        { periodId: 'p2026' },
        { periodId: 'p2026' },
        { periodId: 'p2025' },
        { periodId: null },
      ],
    });
    const historic = [
      { issueDate: '2025-12-20' },
      { issueDate: '2026-01-01' },
      { issueDate: '2026-12-31' },
      { issueDate: '2027-01-01' },
    ];
    expect(deliveredIssues(sub, period(), historic)).toBe(4);
  });

  it('counts a double issue as the issues it counts as, tracked and historic', () => {
    const sub = subscription({
      deliveries: [{ periodId: 'p2026', countsAs: 2 }, { periodId: 'p2026' }],
    });
    const historic = [
      { issueDate: '2026-03-01', countsAs: 2 },
      { issueDate: '2026-05-01' },
    ];
    expect(deliveredIssues(sub, period(), historic)).toBe(6);
  });
});

describe('Vorab-Exemplar (includeUpcoming)', () => {
  const upcoming = subscription({
    id: 's-up',
    startsAt: '2026-11-01T00:00:00.000Z',
    paidUntil: '2027-10-31T00:00:00.000Z',
    autoRenew: false,
    periods: [
      period({
        id: 'pu',
        startsAt: '2026-11-01T00:00:00.000Z',
        endsAt: '2027-10-31T00:00:00.000Z',
      }),
    ],
  });

  it('is off unless the exporter asks for it', () => {
    expect(classifySubscription(upcoming, ISSUE, QUOTA_6)).toEqual({
      include: false,
      reason: 'future',
    });
  });

  it('includes a paid subscription starting after the ship day as a gift charged to no period', () => {
    expect(
      classifySubscription(upcoming, ISSUE, QUOTA_6, { includeUpcoming: true })
    ).toEqual({
      include: true,
      reason: 'gift',
      zahlungsstatus: 'Vorab-Exemplar, Abo ab 01.11.2026',
      unpaid: false,
      periodId: null,
      openWithoutInvoice: false,
    });
  });

  it('wants the subscription to be paid or renewing, and not cancelled', () => {
    const on = { includeUpcoming: true };
    expect(
      classifySubscription(
        {
          ...upcoming,
          deactivation: {
            date: '2026-11-01T00:00:00.000Z',
            reason: 'userSelfDeactivated',
          },
        },
        ISSUE,
        QUOTA_6,
        on
      )
    ).toEqual({ include: false, reason: 'future' });
    expect(
      classifySubscription({ ...upcoming, paidUntil: null }, ISSUE, QUOTA_6, on)
    ).toEqual({ include: false, reason: 'future' });
    expect(
      classifySubscription(
        { ...upcoming, paidUntil: null, autoRenew: true },
        ISSUE,
        QUOTA_6,
        on
      )
    ).toMatchObject({ include: true, reason: 'gift', unpaid: true });
  });

  it('gives the gift again on every flagged export', () => {
    expect(
      classifySubscription(
        { ...upcoming, deliveries: [{ periodId: null }, { periodId: null }] },
        ISSUE,
        QUOTA_6,
        { includeUpcoming: true }
      )
    ).toMatchObject({ include: true, reason: 'gift' });
  });
});

describe('classifySubscription — a periodicity set to 0 gets nothing', () => {
  const none = (printIssues: Record<string, number>) => ({
    productType: 'Subscription',
    printIssues,
  });

  it('skips a paid subscription whose periodicity is worth 0 issues', () => {
    expect(
      classifySubscription(
        subscription({ memberPlan: none({ yearly: 0 }) }),
        ISSUE,
        QUOTA_6
      )
    ).toEqual({ include: false, reason: 'noPrintIssues' });
  });

  it("looks only at the periodicity of the subscription's period", () => {
    expect(
      classifySubscription(
        subscription({ memberPlan: none({ monthly: 0, yearly: 6 }) }),
        ISSUE,
        QUOTA_6
      )
    ).toMatchObject({ include: true, reason: 'paid' });
  });

  it('skips a renewing «offen» subscription and owes it nothing after its period', () => {
    const renewing = subscription({
      memberPlan: none({ yearly: 0 }),
      paidUntil: '2026-09-30T00:00:00.000Z',
      periods: [
        period({
          startsAt: '2025-10-01T00:00:00.000Z',
          endsAt: '2026-09-30T00:00:00.000Z',
        }),
      ],
    });

    expect(classifySubscription(renewing, ISSUE, QUOTA_6)).toEqual({
      include: false,
      reason: 'noPrintIssues',
    });
    expect(
      classifySubscription({ ...renewing, autoRenew: false }, ISSUE, QUOTA_6)
    ).toEqual({ include: false, reason: 'noPrintIssues' });
  });

  it('gives no gift copy to a subscription starting later with such a periodicity', () => {
    const upcoming = subscription({
      memberPlan: none({ yearly: 0 }),
      startsAt: '2026-11-01T00:00:00.000Z',
      paidUntil: '2027-10-31T00:00:00.000Z',
      periods: [
        period({
          id: 'pu',
          startsAt: '2026-11-01T00:00:00.000Z',
          endsAt: '2027-10-31T00:00:00.000Z',
        }),
      ],
    });

    expect(
      classifySubscription(upcoming, ISSUE, QUOTA_6, { includeUpcoming: true })
    ).toEqual({ include: false, reason: 'noPrintIssues' });
  });
});

describe('options: member plans and «offen» readers', () => {
  it('skips a subscription whose plan is not in the allowlist', () => {
    const inList = subscription({
      memberPlan: { productType: 'Subscription', id: 'plan-a' },
    });
    const notInList = subscription({
      memberPlan: { productType: 'Subscription', id: 'plan-b' },
    });
    const options = { memberPlanIds: ['plan-a'] };

    expect(
      classifySubscription(inList, ISSUE, NO_QUOTA, options)
    ).toMatchObject({ include: true });
    expect(classifySubscription(notInList, ISSUE, NO_QUOTA, options)).toEqual({
      include: false,
      reason: 'excludedPlan',
    });
    // null = every subscription plan
    expect(
      classifySubscription(notInList, ISSUE, NO_QUOTA, { memberPlanIds: null })
    ).toMatchObject({ include: true });
  });

  it('leaves «offen» readers out when the medium does not want them', () => {
    const renewing = subscription({ paidUntil: '2026-09-30T00:00:00.000Z' });

    expect(
      classifySubscription(renewing, ISSUE, NO_QUOTA, { includeOpen: false })
    ).toEqual({
      include: false,
      reason: 'lapsed',
    });
    // with a quota they may still be owed copies of their last paid period
    expect(
      classifySubscription(
        subscription({
          paidUntil: '2026-09-30T00:00:00.000Z',
          periods: [period({ endsAt: '2026-09-30T00:00:00.000Z' })],
        }),
        ISSUE,
        { issuesPerYear: 6, historicIssues: [] },
        { includeOpen: false }
      )
    ).toMatchObject({ include: true, reason: 'grace' });
  });
});

describe('resolveGifts', () => {
  const entry = (
    id: string,
    userId: string,
    verdict: ReturnType<typeof classifySubscription>,
    startsAt = '2026-11-01T00:00:00.000Z'
  ) => ({
    subscription: subscription({ id, userId, startsAt }),
    verdict,
  });
  const paid = classifySubscription(subscription(), ISSUE, NO_QUOTA);
  const gift = (startsAt = '2026-11-01T00:00:00.000Z') =>
    classifySubscription(
      subscription({
        startsAt,
        paidUntil: '2027-10-31T00:00:00.000Z',
        autoRenew: false,
      }),
      ISSUE,
      NO_QUOTA,
      { includeUpcoming: true }
    );

  it('drops the gift of a reader who already receives the issue', () => {
    const resolved = resolveGifts([
      entry('a1', 'u1', paid),
      entry('a2', 'u1', gift()),
    ]);

    expect(resolved.map(e => e.verdict)).toEqual([
      paid,
      { include: false, reason: 'future' },
    ]);
  });

  it('keeps one gift per reader: the subscription starting first', () => {
    const resolved = resolveGifts([
      entry(
        'b2',
        'u2',
        gift('2026-12-01T00:00:00.000Z'),
        '2026-12-01T00:00:00.000Z'
      ),
      entry(
        'b1',
        'u2',
        gift('2026-11-01T00:00:00.000Z'),
        '2026-11-01T00:00:00.000Z'
      ),
      entry('c1', 'u3', gift()),
    ]);

    expect(resolved.map(e => [e.subscription.id, e.verdict.include])).toEqual([
      ['b2', false],
      ['b1', true],
      ['c1', true],
    ]);
  });

  it('leaves everything else alone and keeps the order', () => {
    const lapsed = classifySubscription(
      subscription({ autoRenew: false, paidUntil: null }),
      ISSUE,
      NO_QUOTA
    );
    const entries = [entry('d1', 'u4', lapsed), entry('d2', 'u5', paid)];

    expect(resolveGifts(entries)).toEqual(entries);
  });
});
