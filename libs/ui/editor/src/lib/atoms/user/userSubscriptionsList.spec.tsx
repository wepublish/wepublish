import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
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

describe('UserSubscriptionsList print issues', () => {
  const period = (id: string, startsAt: string, endsAt: string) => ({
    id,
    createdAt: startsAt,
    startsAt,
    endsAt,
    amount: 12000,
    invoiceID: `invoice-${id}`,
    isPaid: true,
  });

  const withProgress = (
    progress: Partial<
      NonNullable<UserSubscriptionFragment['printIssueProgress']>
    > | null
  ) =>
    subscription('sub', 'Basic', {
      periods: [
        period('p2026', '2026-01-01T00:00:00.000Z', '2026-12-31T00:00:00.000Z'),
        period('p2025', '2025-01-01T00:00:00.000Z', '2025-12-31T00:00:00.000Z'),
      ],
      printIssueProgress: progress && {
        periodId: 'p2026',
        received: 7,
        entitled: 12,
        owed: 5,
        relevant: true,
        issues: [
          {
            label: '#116',
            issueDate: '2026-10-09',
            batch: 0,
            deliveredAt: '2026-10-05T09:00:00.000Z',
            countsAs: 1,
          },
          {
            label: '#117',
            issueDate: '2026-11-13',
            batch: 1,
            deliveredAt: '2026-11-20T09:00:00.000Z',
            countsAs: 2,
          },
        ],
        ...progress,
      },
    } as Partial<UserSubscriptionFragment>);

  const renderList = (sub: UserSubscriptionFragment) =>
    renderWithTheme(
      <MemoryRouter>
        <UserSubscriptionsList
          subscriptions={[sub]}
          userId="user-1"
        />
      </MemoryRouter>
    );

  const expand = () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'userSubscriptionList.periodRange' })
    );

  it('shows how many issues the subscription received of those promised', () => {
    renderList(withProgress({}));

    expect(
      screen.getByText('userSubscriptionList.printIssuesReceived 7 12')
    ).toBeInTheDocument();
  });

  it('writes ∞ for a lifetime subscription', () => {
    renderList(withProgress({ entitled: null, owed: 0 }));

    expect(
      screen.getByText('userSubscriptionList.printIssuesReceived 7 ∞')
    ).toBeInTheDocument();
  });

  it('lists the received issues under their period', () => {
    renderList(withProgress({}));
    expand();

    const rows = screen.getAllByRole('row').map(row => row.textContent ?? '');
    const at = (text: string) => rows.findIndex(row => row.includes(text));

    expect(
      screen.getByText(
        'userSubscriptionList.printIssue #116 9.10.2026 userSubscriptionList.printList 5.10.2026'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'userSubscriptionList.printIssue #117 13.11.2026 userSubscriptionList.printSupplement 1 20.11.2026',
        { exact: false }
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('userSubscriptionList.printIssueCountsAs 2')
    ).toBeInTheDocument();
    // right below the 2026 period, before the 2025 one
    expect(at('#116')).toBeGreaterThan(at('1.1.2026 – 31.12.2026'));
    expect(at('#116')).toBeLessThan(at('1.1.2025 – 31.12.2025'));
  });

  it('shows nothing for a subscription that no longer counts', () => {
    renderList(withProgress({ relevant: false }));
    expand();

    expect(
      screen.queryByText(/userSubscriptionList.printIssuesReceived/)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/#116/)).not.toBeInTheDocument();
  });

  it('shows nothing without progress', () => {
    renderList(withProgress(null));
    expand();

    expect(
      screen.queryByText(/userSubscriptionList.printIssue/)
    ).not.toBeInTheDocument();
  });
});
