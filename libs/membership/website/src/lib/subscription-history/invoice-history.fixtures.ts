import { mockMemberPlan, mockPaymentMethod } from '@wepublish/mocks/website';

import { invoiceFixture, subscriptionFixture } from '../membership.fixtures';
import { InvoiceHistoryProps } from './invoice-history';

// the props of InvoiceHistory per case, for its spec

const onPay = async () => undefined;

const memberPlan = mockMemberPlan();
const payrexx = mockPaymentMethod({
  id: 'payrexx',
  name: 'Payrexx',
  slug: 'payrexx',
  paymentProviderID: 'payrexx',
  description: 'payrexx',
});
const bexio = mockPaymentMethod({
  id: 'bexio',
  name: 'Rechnung',
  slug: 'bexio',
  paymentProviderID: 'bexio',
  description: 'bexio',
});

const subscription = subscriptionFixture({
  memberPlan,
  paymentMethod: payrexx,
});
const bexioSubscription = subscriptionFixture(
  { memberPlan, paymentMethod: bexio },
  { id: 'subscription-bexio' }
);

const invoices = [
  invoiceFixture(subscription, {
    id: 'paid-2024',
    description: 'Jahresabo 2024',
    dueAt: '2024-01-01T00:00:00.000Z',
    paidAt: '2023-12-10T00:00:00.000Z',
  }),
  invoiceFixture(subscription, {
    id: 'open-2026',
    description: 'Jahresabo 2026',
    dueAt: '2026-01-01T00:00:00.000Z',
  }),
  invoiceFixture(subscription, {
    id: 'canceled-2025',
    description: 'Jahresabo 2025 (storniert)',
    dueAt: '2025-01-01T00:00:00.000Z',
    canceledAt: '2025-02-01T00:00:00.000Z',
  }),
  invoiceFixture(subscription, {
    id: 'paid-2025',
    description: 'Jahresabo 2025',
    dueAt: '2025-01-01T00:00:00.000Z',
    paidAt: '2024-12-12T00:00:00.000Z',
  }),
];

export const Default: InvoiceHistoryProps = {
  data: { __typename: 'Query', userInvoices: invoices },
  loading: false,
  onPay,
};

// on a subscription's own page: no subscription row to nest under
export const Standalone: InvoiceHistoryProps = {
  data: { __typename: 'Query', userInvoices: invoices },
  loading: false,
  onPay,
  nested: false,
};

// in the profile's table: the latest two, older open ones, a link to the rest
export const Latest: InvoiceHistoryProps = {
  data: {
    __typename: 'Query',
    userInvoices: [
      ...invoices,
      invoiceFixture(subscription, {
        id: 'open-2023',
        description: 'Jahresabo 2023',
        dueAt: '2023-01-01T00:00:00.000Z',
      }),
    ],
  },
  loading: false,
  onPay,
  allInvoicesUrl: '/profile/subscription/subscription-1',
};

export const WithBexio: InvoiceHistoryProps = {
  data: {
    __typename: 'Query',
    userInvoices: [
      invoiceFixture(bexioSubscription, {
        id: 'open-bexio',
        description: 'Jahresabo 2026',
      }),
    ],
  },
  loading: false,
  onPay,
};

export const Empty: InvoiceHistoryProps = {
  data: { __typename: 'Query', userInvoices: [] },
  loading: false,
};

export const Loading: InvoiceHistoryProps = {
  data: undefined,
  loading: true,
};
