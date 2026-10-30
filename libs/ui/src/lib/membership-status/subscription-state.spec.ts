import {
  compareSubscriptions,
  getSubscriptionState,
  SubscriptionStateInput,
} from './subscription-state';

const now = new Date('2026-06-01T00:00:00.000Z');

const subscription = (
  overrides: Partial<SubscriptionStateInput> = {}
): SubscriptionStateInput => ({
  startsAt: '2023-01-01T00:00:00.000Z',
  paidUntil: '2026-12-31T00:00:00.000Z',
  deactivation: null,
  ...overrides,
});

describe('getSubscriptionState', () => {
  it('is active when started and paid beyond today', () => {
    expect(getSubscriptionState(subscription(), now)).toBe('active');
  });

  it('is expired once paidUntil has passed, even without a deactivation', () => {
    expect(
      getSubscriptionState(
        subscription({ paidUntil: '2026-01-31T00:00:00.000Z' }),
        now
      )
    ).toBe('expired');
  });

  it('is unpaid when nothing has been paid yet', () => {
    expect(getSubscriptionState(subscription({ paidUntil: null }), now)).toBe(
      'unpaid'
    );
  });

  it('is planned when it starts in the future', () => {
    expect(
      getSubscriptionState(
        subscription({ startsAt: '2026-07-01T00:00:00.000Z' }),
        now
      )
    ).toBe('planned');
  });

  it('is deactivated whenever a deactivation exists', () => {
    expect(
      getSubscriptionState(
        subscription({ deactivation: { date: '2026-12-31T00:00:00.000Z' } }),
        now
      )
    ).toBe('deactivated');
  });
});

describe('compareSubscriptions', () => {
  const sorted = (
    subscriptions: Array<SubscriptionStateInput & { id: string }>
  ) =>
    [...subscriptions]
      .sort((a, b) => compareSubscriptions(a, b, now))
      .map(({ id }) => id);

  it('lists active subscriptions first, then by furthest paidUntil', () => {
    expect(
      sorted([
        {
          id: 'old',
          ...subscription({ paidUntil: '2020-12-31T00:00:00.000Z' }),
        },
        {
          id: 'lapsed',
          ...subscription({ paidUntil: '2021-12-31T00:00:00.000Z' }),
        },
        {
          id: 'current',
          ...subscription({ paidUntil: '2999-12-31T00:00:00.000Z' }),
        },
      ])
    ).toEqual(['current', 'lapsed', 'old']);
  });

  it('breaks ties by the newest createdAt, else the newest start', () => {
    const unpaid = { paidUntil: null };

    expect(
      sorted([
        {
          id: 'older',
          ...subscription({ ...unpaid, createdAt: '2024-01-01T00:00:00.000Z' }),
        },
        {
          id: 'newer',
          ...subscription({ ...unpaid, createdAt: '2025-01-01T00:00:00.000Z' }),
        },
      ])
    ).toEqual(['newer', 'older']);

    expect(
      sorted([
        {
          id: 'earlier',
          ...subscription({ ...unpaid, startsAt: '2024-01-01T00:00:00.000Z' }),
        },
        {
          id: 'later',
          ...subscription({ ...unpaid, startsAt: '2025-01-01T00:00:00.000Z' }),
        },
      ])
    ).toEqual(['later', 'earlier']);
  });
});
