import type { QuotaConfig, RulePeriod } from '../rules/entitlement';
import { printIssueProgress, type ProgressSubscription } from './progress';

const TODAY = '2026-11-23';

const period = (overrides: Partial<RulePeriod> = {}): RulePeriod => ({
  id: 'p-2026',
  startsAt: '2026-01-01T00:00:00.000Z',
  endsAt: '2027-12-31T00:00:00.000Z',
  paymentPeriodicity: 'biennial',
  paid: true,
  invoiceId: 'i-2026',
  ...overrides,
});

const received = (
  label: string,
  overrides: Partial<ProgressSubscription['deliveries'][number]> = {}
) => ({
  periodId: 'p-2026',
  countsAs: 1,
  label,
  issueDate: '2026-01-15',
  batch: 0,
  deliveredAt: '2026-01-10T09:00:00.000Z',
  ...overrides,
});

const subscription = (
  overrides: Partial<ProgressSubscription> = {}
): ProgressSubscription => ({
  id: 's1',
  userId: 'u1',
  startsAt: '2026-01-01T00:00:00.000Z',
  paidUntil: '2027-12-31T00:00:00.000Z',
  autoRenew: true,
  deactivation: null,
  memberPlan: { productType: 'Subscription' },
  periods: [period()],
  openInvoiceIds: [],
  deliveries: [],
  ...overrides,
});

const QUOTA: QuotaConfig = { issuesPerYear: 6, historicIssues: [] };

describe('printIssueProgress', () => {
  it('counts what the running period received against what it is worth', () => {
    const progress = printIssueProgress(
      subscription({
        deliveries: Array.from({ length: 7 }, (_, i) =>
          received(`#${110 + i}`)
        ),
      }),
      QUOTA,
      TODAY
    );

    // two years at six a year
    expect(progress).toMatchObject({
      subscriptionId: 's1',
      periodId: 'p-2026',
      received: 7,
      entitled: 12,
      owed: 5,
      relevant: true,
    });
    expect(progress!.issues).toHaveLength(7);
  });

  it('counts a double issue twice and historic issues inside the period as received', () => {
    expect(
      printIssueProgress(
        subscription({ deliveries: [received('#3/4', { countsAs: 2 })] }),
        { ...QUOTA, historicIssues: [{ issueDate: '2026-02-01' }] },
        TODAY
      )
    ).toMatchObject({ received: 3, owed: 9 });
  });

  it('lists only the issues of that period, a supplement as such', () => {
    const progress = printIssueProgress(
      subscription({
        deliveries: [
          received('#117', { batch: 1 }),
          received('#99', { periodId: 'p-2024' }),
        ],
      }),
      QUOTA,
      TODAY
    );

    expect(progress!.issues).toEqual([
      expect.objectContaining({ label: '#117', batch: 1 }),
    ]);
  });

  it('owes nothing for a lifetime subscription and shows no number', () => {
    expect(
      printIssueProgress(
        subscription({
          periods: [period({ paymentPeriodicity: 'lifetime' })],
          deliveries: [received('#117')],
        }),
        QUOTA,
        TODAY
      )
    ).toMatchObject({ received: 1, entitled: null, owed: 0 });
  });

  it('has nothing to show where no issues are promised or it is no subscription', () => {
    for (const sub of [
      subscription({
        memberPlan: {
          productType: 'Subscription',
          printIssues: { biennial: 0 },
        },
      }),
      subscription({ memberPlan: { productType: 'Donation' } }),
      subscription({ periods: [] }),
    ]) {
      expect(printIssueProgress(sub, QUOTA, TODAY)).toBeNull();
    }

    // no issues per year and no number on the plan: nothing promised
    expect(
      printIssueProgress(subscription(), { ...QUOTA, issuesPerYear: 0 }, TODAY)
    ).toBeNull();
  });

  it('never owes less than nothing, though a running period may get more', () => {
    expect(
      printIssueProgress(
        subscription({
          periods: [
            period({
              paymentPeriodicity: 'yearly',
              endsAt: '2026-12-31T00:00:00.000Z',
            }),
          ],
          deliveries: Array.from({ length: 8 }, (_, i) => received(`#${i}`)),
        }),
        QUOTA,
        TODAY
      )
    ).toMatchObject({ received: 8, entitled: 6, owed: 0 });
  });

  describe('a subscription that ended', () => {
    const ended = (endsAt: string, copies: number) =>
      subscription({
        paidUntil: endsAt,
        autoRenew: false,
        deactivation: { date: endsAt, reason: 'userSelfDeactivated' },
        periods: [period({ paymentPeriodicity: 'yearly', endsAt })],
        deliveries: Array.from({ length: copies }, (_, i) => received(`#${i}`)),
      });

    it('stays relevant while copies are still owed, for the time of two issues', () => {
      // ended 30.9.2026, owed until 31.1.2027 at six issues a year
      expect(
        printIssueProgress(ended('2026-09-30T00:00:00.000Z', 4), QUOTA, TODAY)
      ).toMatchObject({ received: 4, entitled: 6, owed: 2, relevant: true });
    });

    it('is no longer relevant once it got everything or the time is over', () => {
      expect(
        printIssueProgress(ended('2026-09-30T00:00:00.000Z', 6), QUOTA, TODAY)
      ).toMatchObject({ owed: 0, relevant: false });
      expect(
        printIssueProgress(ended('2026-03-31T00:00:00.000Z', 2), QUOTA, TODAY)
      ).toMatchObject({ owed: 4, relevant: false });
    });
  });
});
