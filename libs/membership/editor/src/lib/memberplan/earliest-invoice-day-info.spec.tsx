import '@testing-library/jest-dom/vitest';
import type { Mock } from 'vitest';
import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import {
  EarliestInvoiceDaysDocument,
  PaymentPeriodicity,
  SubscriptionEvent,
  SubscriptionFlowsDocument,
} from '@wepublish/editor/api';
import { AuthContext } from '@wepublish/ui/editor';
import { MemoryRouter } from 'react-router-dom';

import {
  EarliestInvoiceDayInfo,
  InvoiceDayConflicts,
} from './earliest-invoice-day-info';
import { PlanOffer } from './earliest-invoice-day';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}(${Object.values(options).join(',')})` : key,
  }),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const days = [
  { periodicity: PaymentPeriodicity.Monthly, days: -25 },
  { periodicity: PaymentPeriodicity.Yearly, days: -360 },
];

const offer = (...periodicities: PaymentPeriodicity[]): PlanOffer => ({
  paymentPeriodicities: periodicities,
  paymentMethods: [{ id: 'bill' }],
  forceAutoRenewal: false,
});

const defaultFlow = {
  id: 'default-id',
  default: true,
  periodicities: [],
  paymentMethods: [],
  autoRenewal: [],
  intervals: [
    {
      id: 'invoice',
      event: SubscriptionEvent.InvoiceCreation,
      daysAwayFromEnding: -38,
    },
  ],
};

const mockQueries = (flows: unknown[] = [defaultFlow]) =>
  mockedUseQuery.mockImplementation((document: unknown) => ({
    data:
      document === EarliestInvoiceDaysDocument ? { earliestInvoiceDays: days }
      : document === SubscriptionFlowsDocument ? { subscriptionFlows: flows }
      : undefined,
  }));

const session = (...permissions: string[]) => ({
  session: {
    email: 'editor@example.com',
    sessionToken: 'token',
    sessionRoles: [{ permissions: permissions.map(id => ({ id })) }],
  },
});

const renderWith = (ui: React.ReactNode, ...permissions: string[]) =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <AuthContext.Provider value={session(...permissions) as never}>
          {ui}
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>
  );

const CAN_GET_FLOWS = 'CAN_GET_SUBSCRIPTION_FLOWS';

describe('EarliestInvoiceDayInfo', () => {
  beforeEach(() => {
    mockedUseQuery.mockReset();
    mockQueries();
  });

  it('tells the earliest invoice day of the shortest periodicity the plan offers', () => {
    renderWith(
      <EarliestInvoiceDayInfo
        offers={[offer(PaymentPeriodicity.Yearly, PaymentPeriodicity.Monthly)]}
      />
    );

    expect(
      screen.getByText('memberPlanEdit.earliestInvoiceDay.label(25)')
    ).toBeTruthy();
    expect(
      screen.getByRole('button', {
        name: 'memberPlanEdit.earliestInvoiceDay.help(memberPlanList.paymentPeriodicity.monthly,-25)',
      })
    ).toBeTruthy();
  });

  it('says it in small print, as a side note to the periodicities', () => {
    renderWith(
      <EarliestInvoiceDayInfo offers={[offer(PaymentPeriodicity.Monthly)]} />
    );

    expect(
      screen
        .getByText(/memberPlanEdit.earliestInvoiceDay.label/)
        .classList.contains('MuiTypography-caption')
    ).toBe(true);
  });

  it('shows nothing while the plan offers no periodicity', () => {
    const { container } = renderWith(<EarliestInvoiceDayInfo offers={[]} />);

    expect(container.textContent).toBe('');
  });
});

describe('InvoiceDayConflicts', () => {
  beforeEach(() => {
    mockedUseQuery.mockReset();
    mockQueries();
  });

  it('warns about a flow that creates invoices earlier than the plan allows and links to it', () => {
    renderWith(
      <InvoiceDayConflicts
        memberPlanId="plan-1"
        offers={[offer(PaymentPeriodicity.Monthly)]}
      />,
      CAN_GET_FLOWS
    );

    expect(screen.getByRole('alert').textContent).toContain(
      'memberPlanEdit.earliestInvoiceDay.conflict(memberPlanEdit.earliestInvoiceDay.defaultFlow,-38,memberPlanList.paymentPeriodicity.monthly,25)'
    );
    expect(
      screen
        .getByRole('link', {
          name: 'memberPlanEdit.earliestInvoiceDay.openFlow',
        })
        .getAttribute('href')
    ).toBe('/communicationflows/flow/default');
    expect(mockedUseQuery).toHaveBeenCalledWith(
      SubscriptionFlowsDocument,
      expect.objectContaining({
        variables: { defaultFlowOnly: false, memberPlanId: 'plan-1' },
        skip: false,
      })
    );
  });

  it('has nothing to warn about while the flows suit the plan', () => {
    renderWith(
      <InvoiceDayConflicts
        memberPlanId="plan-1"
        offers={[offer(PaymentPeriodicity.Yearly)]}
      />,
      CAN_GET_FLOWS
    );

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('looks at the default flow alone for a plan that is not saved yet', () => {
    renderWith(
      <InvoiceDayConflicts offers={[offer(PaymentPeriodicity.Monthly)]} />,
      CAN_GET_FLOWS
    );

    expect(mockedUseQuery).toHaveBeenCalledWith(
      SubscriptionFlowsDocument,
      expect.objectContaining({ variables: { defaultFlowOnly: true } })
    );
  });

  it('does not ask for the flows without the permission to see them', () => {
    renderWith(
      <InvoiceDayConflicts
        memberPlanId="plan-1"
        offers={[offer(PaymentPeriodicity.Monthly)]}
      />
    );

    expect(mockedUseQuery).toHaveBeenCalledWith(
      SubscriptionFlowsDocument,
      expect.objectContaining({ skip: true })
    );
  });
});
