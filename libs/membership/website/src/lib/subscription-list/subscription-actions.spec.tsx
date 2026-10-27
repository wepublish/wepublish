import { screen } from '@testing-library/react';
import {
  mockMemberPlan,
  mockPaymentMethod,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  Currency,
  FullSubscriptionPaymentMethodChangeFragment,
  PaymentMethodChangeKind,
  PaymentMethodChangeState,
} from '@wepublish/website/api';

import { subscriptionFixture } from '../membership.fixtures';
import {
  IMMEDIATE_ACTIONS,
  SubscriptionActions,
  SubscriptionActionsProps,
} from './subscription-actions';

// the plan offers other payment methods than the subscription's own
const subscription = subscriptionFixture(
  { memberPlan: mockMemberPlan(), paymentMethod: mockPaymentMethod() },
  { canExtend: true, canRenewPaymentMethod: true }
);

const pendingChange: FullSubscriptionPaymentMethodChangeFragment = {
  __typename: 'SubscriptionPaymentMethodChange',
  id: 'change-1',
  createdAt: '2026-10-20T00:00:00.000Z',
  kind: PaymentMethodChangeKind.Authorization,
  state: PaymentMethodChangeState.Pending,
  amount: 1,
  currency: Currency.Chf,
  expiresAt: '2026-11-03T00:00:00.000Z',
  completedAt: null,
  paymentMethod: mockPaymentMethod({ name: 'Payrexx' }),
};

const handlers = {
  cancel: vi.fn(async () => undefined),
  extend: vi.fn(async () => undefined),
  changePaymentMethod: vi.fn(async () => undefined),
  cancelPaymentMethodChange: vi.fn(async () => undefined),
};

const renderActions = (props: Partial<SubscriptionActionsProps> = {}) =>
  renderWithProviders(
    <SubscriptionActions
      {...subscription}
      {...handlers}
      {...props}
    />
  );

const buttonNames = () =>
  screen.queryAllByRole('button').map(button => button.textContent);

describe('SubscriptionActions', () => {
  it('offers every action by default', () => {
    renderActions();

    expect(buttonNames()).toEqual(
      expect.arrayContaining([
        'Abo kündigen',
        'Bestehende Zahlungsmethode aktualisieren',
        'Zahlungsmethode ändern',
        'Jetzt verlängern',
      ])
    );
  });

  it('offers only the actions it is given', () => {
    renderActions({ actions: ['extend'] });

    expect(buttonNames()).toEqual(['Jetzt verlängern']);
  });

  it('shows a pending payment method change only when asked to', () => {
    renderActions({
      pendingPaymentMethodChange: pendingChange,
      actions: ['extend'],
    });
    expect(screen.queryByText(/Wechsel zu Payrexx ausstehend/)).toBeNull();
  });

  it('shows a pending payment method change with its own buttons', () => {
    renderActions({
      pendingPaymentMethodChange: pendingChange,
      actions: ['pendingChange'],
    });

    expect(
      screen.getByText(/Wechsel zu Payrexx ausstehend/)
    ).toBeInTheDocument();
    expect(buttonNames()).toEqual(['Wechsel abbrechen', 'Fortsetzen']);
  });

  it('keeps cancelling and the payment method out of the immediate actions', () => {
    renderActions({ actions: IMMEDIATE_ACTIONS });

    expect(buttonNames()).toEqual(['Jetzt verlängern']);
  });
});
