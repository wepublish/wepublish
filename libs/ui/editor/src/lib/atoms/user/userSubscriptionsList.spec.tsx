import { render, screen } from '@testing-library/react';
import { UserSubscriptionFragment } from '@wepublish/editor/api';
import { MemoryRouter } from 'react-router-dom';

import {
  getSubscriptionStatus,
  UserSubscriptionsList,
} from './userSubscriptionsList';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key} ${Object.values(opts).join(' ')}` : key,
    i18n: { language: 'de' },
  }),
}));

const period = (
  id: string,
  startsAt: string,
  isPaid = true
): UserSubscriptionFragment['periods'][number] => ({
  id,
  createdAt: startsAt,
  startsAt,
  endsAt: startsAt,
  amount: 12000,
  invoiceID: `invoice-${id}`,
  isPaid,
});

const subscription = (
  id: string,
  planName: string,
  createdAt: string,
  overrides: Partial<UserSubscriptionFragment> = {}
) =>
  ({
    id,
    createdAt,
    startsAt: createdAt,
    memberPlan: { name: planName },
    paymentPeriodicity: 'yearly',
    monthlyAmount: 1000,
    currency: 'CHF',
    autoRenew: true,
    confirmed: true,
    paidUntil: null,
    deactivation: null,
    periods: [],
    ...overrides,
  }) as unknown as UserSubscriptionFragment;

const renderList = (subscriptions: UserSubscriptionFragment[]) =>
  render(
    <MemoryRouter>
      <UserSubscriptionsList
        subscriptions={subscriptions}
        userId="user-1"
      />
    </MemoryRouter>
  );

describe('getSubscriptionStatus', () => {
  const now = new Date('2026-06-01T00:00:00.000Z');

  it('treats a subscription without deactivation as active', () => {
    expect(getSubscriptionStatus(subscription('a', 'Basis', ''), now)).toBe(
      'active'
    );
  });

  it('stays active until a scheduled deactivation date is reached', () => {
    const scheduled = subscription('a', 'Basis', '', {
      deactivation: { date: '2026-12-31T00:00:00.000Z' },
    } as Partial<UserSubscriptionFragment>);

    expect(getSubscriptionStatus(scheduled, now)).toBe('active');
  });

  it('is expired once the deactivation date has passed', () => {
    const deactivated = subscription('a', 'Basis', '', {
      deactivation: { date: '2026-01-31T00:00:00.000Z' },
    } as Partial<UserSubscriptionFragment>);

    expect(getSubscriptionStatus(deactivated, now)).toBe('expired');
  });
});

describe('UserSubscriptionsList', () => {
  it('lists the newest subscription first', () => {
    renderList([
      subscription('old', 'Basis-Abo', '2023-04-23T00:00:00.000Z'),
      subscription('new', 'Abo Plus', '2024-04-23T00:00:00.000Z'),
    ]);

    const plans = screen.getAllByTestId('subscription-plan');

    expect(plans.map(plan => plan.textContent)).toEqual([
      'Abo Plus',
      'Basis-Abo',
    ]);
  });

  it('shows the newest period on top', () => {
    renderList([
      subscription('a', 'Basis-Abo', '2023-01-01T00:00:00.000Z', {
        periods: [
          period('p-2023', '2023-01-15T00:00:00.000Z'),
          period('p-2024', '2024-01-15T00:00:00.000Z'),
        ],
      }),
    ]);

    const titles = screen.getAllByTestId('period-title');

    expect(titles.map(title => title.textContent)).toEqual([
      'userSubscriptionList.periodTitle 01.2024',
      'userSubscriptionList.periodTitle 01.2023',
    ]);
  });

  it('labels active and expired subscriptions', () => {
    renderList([
      subscription('a', 'Basis-Abo', '2023-01-01T00:00:00.000Z'),
      subscription('b', 'Abo Plus', '2022-01-01T00:00:00.000Z', {
        deactivation: { date: '2023-01-01T00:00:00.000Z' },
      } as Partial<UserSubscriptionFragment>),
    ]);

    expect(
      screen.getByText('userSubscriptionList.status.active')
    ).not.toBeNull();
    expect(
      screen.getByText('userSubscriptionList.status.expired')
    ).not.toBeNull();
  });

  it('marks unpaid invoices as open', () => {
    renderList([
      subscription('a', 'Basis-Abo', '2023-01-01T00:00:00.000Z', {
        paidUntil: '2023-12-31T00:00:00.000Z',
        periods: [period('p', '2023-01-01T00:00:00.000Z', false)],
      }),
    ]);

    expect(
      screen.getByText('userSubscriptionList.invoiceUnpaid')
    ).not.toBeNull();
  });

  it('only becomes scrollable with more than two subscriptions', () => {
    const { unmount } = renderList([
      subscription('a', 'A', '2023-01-01T00:00:00.000Z'),
      subscription('b', 'B', '2023-02-01T00:00:00.000Z'),
    ]);

    expect(
      screen.getByTestId('subscription-scroller').dataset['scrollable']
    ).toBe('false');

    unmount();
    renderList([
      subscription('a', 'A', '2023-01-01T00:00:00.000Z'),
      subscription('b', 'B', '2023-02-01T00:00:00.000Z'),
      subscription('c', 'C', '2023-03-01T00:00:00.000Z'),
    ]);

    expect(
      screen.getByTestId('subscription-scroller').dataset['scrollable']
    ).toBe('true');
  });
});
