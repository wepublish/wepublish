import { waitFor } from '@testing-library/react';
import {
  mockMemberPlan,
  mockPaymentMethod,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  InvoicesDocument,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import { BuilderSubscriptionListProps } from '@wepublish/website/builder';

import { invoiceFixture, subscriptionFixture } from '../membership.fixtures';
import { SubscriptionListContainer } from './subscription-list-container';

const plan = {
  memberPlan: mockMemberPlan(),
  paymentMethod: mockPaymentMethod(),
};
const subscription = subscriptionFixture(plan);
const invoice = invoiceFixture(subscription);

const mocks = [
  {
    request: { query: SubscriptionsDocument },
    result: { data: { userSubscriptions: [subscription] } },
  },
  {
    request: { query: InvoicesDocument },
    result: { data: { userInvoices: [invoice] } },
  },
];

describe('SubscriptionListContainer with its own list', () => {
  it('renders the given list with the subscriptions, invoices and actions', async () => {
    const List = vi.fn((_: BuilderSubscriptionListProps) => null);

    renderWithProviders(<SubscriptionListContainer List={List} />, { mocks });

    await waitFor(() => {
      const props = List.mock.lastCall?.[0];

      expect(props?.data?.userSubscriptions.map(({ id }) => id)).toEqual([
        subscription.id,
      ]);
      expect(props?.invoices.data?.userInvoices.map(({ id }) => id)).toEqual([
        invoice.id,
      ]);
    });

    const props = List.mock.lastCall?.[0];
    expect(props?.onCancel).toBeInstanceOf(Function);
    expect(props?.onExtend).toBeInstanceOf(Function);
    expect(props?.onChangePaymentMethod).toBeInstanceOf(Function);
    expect(props?.onCancelPaymentMethodChange).toBeInstanceOf(Function);
  });
});
