import {
  EligibilityList,
  EligibilitySubscription,
  isEligibleForNewsletterList,
} from './newsletter-eligibility';

describe('isEligibleForNewsletterList', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const gatedList: EligibilityList = {
    requiresSubscription: true,
    anyMemberPlan: false,
    memberPlanIds: ['plan-a'],
  };

  const paidSubscription: EligibilitySubscription = {
    memberPlanID: 'plan-a',
    confirmed: true,
    startsAt: new Date('2026-01-01'),
    paidUntil: new Date('2027-01-01'),
    gracePeriod: 0,
  };

  it('allows everyone on a list that does not require a subscription', () => {
    expect(
      isEligibleForNewsletterList(
        {
          requiresSubscription: false,
          anyMemberPlan: false,
          memberPlanIds: [],
        },
        []
      )
    ).toBe(true);
  });

  it('allows a paid subscription on a selected plan', () => {
    expect(isEligibleForNewsletterList(gatedList, [paidSubscription])).toBe(
      true
    );
  });

  it('allows a subscription within the grace period', () => {
    expect(
      isEligibleForNewsletterList(gatedList, [
        {
          ...paidSubscription,
          paidUntil: new Date('2026-06-10'),
          gracePeriod: 10,
        },
      ])
    ).toBe(true);
  });

  it('rejects an expired subscription', () => {
    expect(
      isEligibleForNewsletterList(gatedList, [
        { ...paidSubscription, paidUntil: new Date('2026-06-01') },
      ])
    ).toBe(false);
  });

  it('rejects an unconfirmed subscription', () => {
    expect(
      isEligibleForNewsletterList(gatedList, [
        { ...paidSubscription, confirmed: false },
      ])
    ).toBe(false);
  });

  it('rejects a subscription on a plan that is not selected', () => {
    expect(
      isEligibleForNewsletterList(gatedList, [
        { ...paidSubscription, memberPlanID: 'plan-b' },
      ])
    ).toBe(false);
  });

  it('allows a subscription on any plan when anyMemberPlan is set', () => {
    expect(
      isEligibleForNewsletterList({ ...gatedList, anyMemberPlan: true }, [
        { ...paidSubscription, memberPlanID: 'plan-b' },
      ])
    ).toBe(true);
  });

  it('rejects a gated list without any subscription', () => {
    expect(isEligibleForNewsletterList(gatedList, [])).toBe(false);
  });

  it('allows an active subscription even when another one has expired', () => {
    expect(
      isEligibleForNewsletterList(
        { ...gatedList, memberPlanIds: ['plan-a', 'plan-b'] },
        [
          { ...paidSubscription, paidUntil: new Date('2026-01-31') },
          { ...paidSubscription, memberPlanID: 'plan-b' },
        ]
      )
    ).toBe(true);
  });
});
