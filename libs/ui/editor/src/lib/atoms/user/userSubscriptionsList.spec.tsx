import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserSubscriptionFragment } from '@wepublish/editor/api';
import { ReactNode } from 'react';
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

vi.mock('../permissionControl', () => ({
  createCheckedPermissionComponent: () => (component: unknown) => component,
  useAuthorisation: () => true,
}));

const subscription = (
  id: string,
  planName: string,
  overrides: Partial<UserSubscriptionFragment> = {}
) =>
  ({
    id,
    createdAt: '2023-01-01T00:00:00.000Z',
    startsAt: '2023-01-01T00:00:00.000Z',
    memberPlan: { name: planName },
    paymentPeriodicity: 'yearly',
    monthlyAmount: 1000,
    currency: 'CHF',
    autoRenew: true,
    confirmed: true,
    paidUntil: '2026-12-31T00:00:00.000Z',
    deactivation: null,
    periods: [],
    ...overrides,
  }) as unknown as UserSubscriptionFragment;

const theme = createTheme({ cssVariables: true });

const renderWithTheme = (ui: ReactNode) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('getSubscriptionStatus', () => {
  const now = new Date('2026-06-01T00:00:00.000Z');
  const label = (overrides: Partial<UserSubscriptionFragment>) =>
    getSubscriptionStatus(subscription('a', 'Basis', overrides), now).label;

  it('is active when started and paid beyond today', () => {
    expect(label({})).toBe('userSubscriptionList.table.active');
  });

  it('is expired once paidUntil has passed, even without a deactivation', () => {
    expect(label({ paidUntil: '2026-01-31T00:00:00.000Z' })).toBe(
      'userSubscriptionList.table.expired'
    );
  });

  it('is unpaid when nothing has been paid yet', () => {
    expect(label({ paidUntil: null })).toBe(
      'userSubscriptionList.table.unpaid'
    );
  });

  it('is planned when it starts in the future', () => {
    expect(label({ startsAt: '2026-07-01T00:00:00.000Z' })).toBe(
      'userSubscriptionList.table.planned'
    );
  });

  it('is deactivated whenever a deactivation exists', () => {
    expect(
      label({
        deactivation: { date: '2026-12-31T00:00:00.000Z' },
      } as Partial<UserSubscriptionFragment>)
    ).toBe('userSubscriptionList.table.deactivated');
  });
});

describe('UserSubscriptionsList', () => {
  it('shows each period invoice as paid, canceled or unpaid', async () => {
    const period = (
      id: string,
      startsAt: string,
      state: { isPaid: boolean; isCanceled: boolean }
    ) => ({
      id,
      createdAt: startsAt,
      startsAt,
      endsAt: startsAt,
      amount: 12000,
      invoiceID: `invoice-${id}`,
      ...state,
    });

    renderWithTheme(
      <MemoryRouter>
        <UserSubscriptionsList
          subscriptions={[
            subscription('a', 'Insider', {
              periods: [
                period('paid', '2024-01-01T00:00:00.000Z', {
                  isPaid: true,
                  isCanceled: false,
                }),
                period('canceled', '2025-01-01T00:00:00.000Z', {
                  isPaid: false,
                  isCanceled: true,
                }),
                period('open', '2026-01-01T00:00:00.000Z', {
                  isPaid: false,
                  isCanceled: false,
                }),
              ],
            } as unknown as Partial<UserSubscriptionFragment>),
          ]}
          userId="user-1"
        />
      </MemoryRouter>
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'userSubscriptionList.periodRange' })
    );

    expect(
      screen.getByRole('img', { name: 'userSubscriptionList.invoicePaid' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'userSubscriptionList.invoiceCanceled' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'userSubscriptionList.invoiceUnpaid' })
    ).toBeInTheDocument();
  });

  it('lists active subscriptions first, then by furthest paidUntil', () => {
    renderWithTheme(
      <MemoryRouter>
        <UserSubscriptionsList
          subscriptions={[
            subscription('old', 'Old-Abo', {
              paidUntil: '2020-12-31T00:00:00.000Z',
            }),
            subscription('lapsed', 'Lapsed-Abo', {
              paidUntil: '2021-12-31T00:00:00.000Z',
            }),
            subscription('current', 'Current-Abo', {
              paidUntil: '2999-12-31T00:00:00.000Z',
            }),
          ]}
          userId="user-1"
        />
      </MemoryRouter>
    );

    const names = screen
      .getAllByText(/-Abo$/)
      .map(element => element.textContent);

    expect(names).toEqual(['Current-Abo', 'Lapsed-Abo', 'Old-Abo']);
  });

  it('says there are no subscriptions in a row spanning every column', () => {
    renderWithTheme(
      <MemoryRouter>
        <UserSubscriptionsList
          subscriptions={[]}
          userId="user-1"
        />
      </MemoryRouter>
    );

    const headers = screen.getAllByRole('columnheader');
    const cell = screen.getByRole('cell', {
      name: 'userList.overview.noSubscriptions',
    });

    expect(cell.getAttribute('colspan')).toBe(String(headers.length));
  });

  it('lets keyboard users scroll the wide table as a named region', () => {
    renderWithTheme(
      <MemoryRouter>
        <UserSubscriptionsList
          subscriptions={[]}
          userId="user-1"
        />
      </MemoryRouter>
    );

    const region = screen.getByRole('region', {
      name: 'userList.overview.subscriptions',
    });

    expect(region.tabIndex).toBe(0);
    expect(region.contains(screen.getByRole('table'))).toBe(true);
  });
});
