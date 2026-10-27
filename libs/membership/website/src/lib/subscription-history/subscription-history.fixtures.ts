import {
  mockMemberPlan,
  mockOperation,
  mockPaymentMethod,
  RenderWithProvidersOptions,
} from '@wepublish/mocks/website';
import {
  CheckInvoiceStatusDocument,
  FullInvoiceFragment,
  InvoicesDocument,
  SubscriptionDeactivationReason,
} from '@wepublish/website/api';
import { BuilderSubscriptionListProps } from '@wepublish/website/builder';

import { invoiceFixture, subscriptionFixture } from '../membership.fixtures';

// SubscriptionHistory's props and the operations its invoice lists send, per
// case, for its spec
export type SubscriptionHistoryFixture = {
  props: BuilderSubscriptionListProps;
  mocks: NonNullable<RenderWithProvidersOptions['mocks']>;
};

const payrexx = mockPaymentMethod({
  id: 'payrexx',
  name: 'Payrexx',
  slug: 'payrexx',
  paymentProviderID: 'payrexx',
  description: 'payrexx',
});

const yearly = subscriptionFixture(
  { memberPlan: mockMemberPlan({ name: 'Jahresabo' }), paymentMethod: payrexx },
  {
    id: 'yearly',
    paidUntil: '2025-12-31T00:00:00.000Z',
    canExtend: true,
    url: '/profile/subscription/yearly',
  }
);
const supporter = subscriptionFixture(
  { memberPlan: mockMemberPlan({ name: 'Förderabo' }), paymentMethod: payrexx },
  { id: 'supporter', paidUntil: '2032-12-31T00:00:00.000Z', canExtend: true }
);
const trial = subscriptionFixture(
  { memberPlan: mockMemberPlan({ name: 'Probeabo' }), paymentMethod: payrexx },
  {
    id: 'trial',
    isActive: false,
    paidUntil: '2024-12-31T00:00:00.000Z',
    deactivation: {
      __typename: 'SubscriptionDeactivation',
      date: '2024-12-31T00:00:00.000Z',
      reason: SubscriptionDeactivationReason.UserSelfDeactivated,
    },
  }
);

const openInvoice = invoiceFixture(yearly, {
  id: 'yearly-2026',
  description: 'Jahresabo 2026',
  dueAt: '2026-01-01T00:00:00.000Z',
});

const invoices: FullInvoiceFragment[] = [
  openInvoice,
  invoiceFixture(yearly, {
    id: 'yearly-2025',
    description: 'Jahresabo 2025',
    dueAt: '2025-01-01T00:00:00.000Z',
    paidAt: '2024-12-10T00:00:00.000Z',
  }),
  invoiceFixture(yearly, {
    id: 'yearly-2024',
    description: 'Jahresabo 2024',
    dueAt: '2024-01-01T00:00:00.000Z',
    paidAt: '2023-12-08T00:00:00.000Z',
  }),
  invoiceFixture(supporter, {
    id: 'supporter-2026',
    description: 'Förderabo 2026',
    dueAt: '2026-01-01T00:00:00.000Z',
    paidAt: '2025-11-03T00:00:00.000Z',
  }),
  invoiceFixture(trial, {
    id: 'trial-2024',
    description: 'Probeabo 2024',
    dueAt: '2024-01-01T00:00:00.000Z',
    paidAt: '2024-01-05T00:00:00.000Z',
  }),
];

const noop = async () => undefined;
const handlers = {
  onCancel: noop,
  onReactivate: noop,
  onRevertUpgrade: noop,
  onExtend: noop,
  onChangePaymentMethod: noop,
  onCancelPaymentMethodChange: noop,
};

export const Default: SubscriptionHistoryFixture = {
  props: {
    data: { __typename: 'Query', userSubscriptions: [trial, supporter, yearly] },
    invoices: {
      data: { __typename: 'Query', userInvoices: invoices },
      loading: false,
      error: undefined,
    },
    subscribeUrl: '/mitmachen',
    loading: false,
    error: undefined,
    ...handlers,
  },
  mocks: [
    mockOperation(InvoicesDocument, {
      maxUsageCount: Number.POSITIVE_INFINITY,
      data: { __typename: 'Query', userInvoices: invoices },
    }),
    mockOperation(CheckInvoiceStatusDocument, {
      variables: { id: openInvoice.id },
      maxUsageCount: Number.POSITIVE_INFINITY,
      data: { __typename: 'Query', checkInvoiceStatus: openInvoice },
    }),
  ],
};

export const Empty: SubscriptionHistoryFixture = {
  props: {
    data: { __typename: 'Query', userSubscriptions: [] },
    invoices: {
      data: { __typename: 'Query', userInvoices: [] },
      loading: false,
      error: undefined,
    },
    subscribeUrl: '/mitmachen',
    loading: false,
    error: undefined,
  },
  mocks: [],
};
