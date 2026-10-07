import { fireEvent, render, screen } from '@testing-library/react';
import {
  InvoicesDocument,
  MemberPlanListDocument,
  PaymentMethodListDocument,
  ReactivateSubscriptionDocument,
  RevertSubscriptionUpgradeDocument,
  SubscriptionDocument,
} from '@wepublish/editor/api';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Mock } from 'vitest';

import { SubscriptionEditView } from './subscriptionEditView';

const { mutationFor } = vi.hoisted(() => {
  const mutations = new Map<unknown, Mock>();

  return {
    mutationFor: (document: unknown) => {
      if (!mutations.has(document)) {
        mutations.set(
          document,
          vi.fn(async () => ({ data: {} }))
        );
      }

      return mutations.get(document) as Mock;
    },
  };
});

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useLazyQuery: () => [vi.fn(), { loading: false }],
  useMutation: (document: unknown) => [
    mutationFor(document),
    { loading: false },
  ],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  // The permission wrappers would otherwise need an authenticated session.
  createCheckedPermissionComponent: () => (component: unknown) => component,
  PermissionControl: ({ children }: { children: React.ReactNode }) => children,
  useAuthorisation: () => true,
}));

const { useQuery } = await import('@apollo/client/react');
const mockedUseQuery = useQuery as unknown as Mock;

const memberPlan = {
  id: 'plan-1',
  name: 'Yearly',
  slug: 'yearly',
  active: true,
  currency: 'CHF',
  extendable: true,
  tags: [],
  periodicityPricing: [],
  availablePaymentMethods: [],
};

const paymentMethod = {
  id: 'payment-method-1',
  name: 'Credit Card',
  slug: 'credit-card',
  active: true,
  gracePeriod: 0,
};

const subscription = (deactivation: unknown, canRevertUpgrade = false) => ({
  canRevertUpgrade,
  id: 'subscription-1',
  createdAt: '2026-01-02T10:00:00.000Z',
  modifiedAt: '2026-01-02T10:00:00.000Z',
  confirmed: true,
  user: {
    id: 'user-1',
    name: 'Muster',
    firstName: 'Max',
    email: 'max@test.ch',
  },
  memberPlan,
  paymentPeriodicity: 'yearly',
  monthlyAmount: 500,
  autoRenew: true,
  startsAt: '2026-01-02T10:00:00.000Z',
  paidUntil: '2027-01-02T10:00:00.000Z',
  properties: [],
  paymentMethod,
  deactivation,
  extendable: true,
  currency: 'CHF',
  goodie: null,
  periods: [],
});

const mockQueries = (deactivation: unknown, canRevertUpgrade = false) => {
  // The results have to be referentially stable, the view reacts to them in effects.
  const refetch = vi.fn();
  const results = new Map<unknown, unknown>([
    [
      SubscriptionDocument,
      {
        loading: false,
        refetch,
        data: {
          subscription: subscription(deactivation, canRevertUpgrade),
        },
      },
    ],
    [
      InvoicesDocument,
      { loading: false, refetch, data: { invoices: { nodes: [] } } },
    ],
    [
      MemberPlanListDocument,
      {
        loading: false,
        refetch,
        data: { memberPlans: { nodes: [memberPlan] } },
      },
    ],
    [
      PaymentMethodListDocument,
      { loading: false, refetch, data: { paymentMethods: [paymentMethod] } },
    ],
  ]);
  const fallback = { loading: false, refetch, data: undefined };

  mockedUseQuery.mockImplementation(
    (document: unknown) => results.get(document) ?? fallback
  );
};

const renderEditView = () =>
  render(
    <MemoryRouter initialEntries={['/subscriptions/edit/subscription-1']}>
      <Routes>
        <Route
          path="/subscriptions/edit/:id"
          element={<SubscriptionEditView />}
        />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  mockedUseQuery.mockReset();
  mutationFor(ReactivateSubscriptionDocument).mockClear();
  mutationFor(RevertSubscriptionUpgradeDocument).mockClear();
});

describe('SubscriptionEditView', () => {
  it('offers no reactivation for a running subscription', async () => {
    mockQueries(null);
    renderEditView();

    expect(
      await screen.findByText(
        'userSubscriptionEdit.deactivation.title.activated'
      )
    ).toBeTruthy();
    expect(screen.queryByTestId('reactivateSubscription')).toBeNull();
  });

  it('reactivates a deactivated subscription after confirmation', async () => {
    mockQueries({ date: '2026-02-01T10:00:00.000Z', reason: 'none' });
    renderEditView();

    fireEvent.click(await screen.findByTestId('reactivateSubscription'));

    const reactivate = mutationFor(ReactivateSubscriptionDocument);
    expect(reactivate).not.toHaveBeenCalled();

    fireEvent.click(
      await screen.findByText('userSubscriptionEdit.reactivation.confirm')
    );

    expect(reactivate).toHaveBeenCalledWith({
      variables: { id: 'subscription-1' },
    });
  });

  it('offers no upgrade revert when the upgrade has been paid', async () => {
    mockQueries({ date: '2026-02-01T10:00:00.000Z', reason: 'none' }, false);
    renderEditView();

    expect(await screen.findByTestId('reactivateSubscription')).toBeTruthy();
    expect(screen.queryByTestId('revertSubscriptionUpgrade')).toBeNull();
  });

  it('reverts an unpaid upgrade after confirmation', async () => {
    mockQueries(
      {
        date: '2026-02-01T10:00:00.000Z',
        reason: 'userReplacedSubscription',
      },
      true
    );
    renderEditView();

    fireEvent.click(await screen.findByTestId('revertSubscriptionUpgrade'));

    const revert = mutationFor(RevertSubscriptionUpgradeDocument);
    expect(revert).not.toHaveBeenCalled();

    fireEvent.click(
      await screen.findByText('userSubscriptionEdit.revertUpgrade.confirm')
    );

    expect(revert).toHaveBeenCalledWith({
      variables: { id: 'subscription-1' },
    });
  });
});
