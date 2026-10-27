import {
  mockAvailablePaymentMethod,
  mockMemberPlan,
  mockOperation,
  mockPaymentMethod,
  RenderWithProvidersOptions,
} from '@wepublish/mocks/website';
import {
  FullMemberPlanFragment,
  FullSubscriptionFragment,
  InvoicesDocument,
  MemberPlanListDocument,
  PaymentPeriodicity,
  SubscriptionDeactivationReason,
} from '@wepublish/website/api';
import { BuilderSubscriptionListProps } from '@wepublish/website/builder';

import { invoiceFixture, subscriptionFixture } from '../membership.fixtures';

// SubscriptionEdit's props and the operations it sends, per case, for its spec
export type SubscriptionEditFixture = {
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
const twint = mockPaymentMethod({
  id: 'twint',
  name: 'TWINT',
  slug: 'twint',
  paymentProviderID: 'payrexx',
  description: 'twint',
});

const plan = (
  id: string,
  name: string,
  monthlyMin: number,
  paymentMethods = [payrexx, twint]
): FullMemberPlanFragment =>
  mockMemberPlan({
    id,
    name,
    availablePaymentMethods: [
      mockAvailablePaymentMethod({
        paymentPeriodicities: [PaymentPeriodicity.Yearly],
        paymentMethods,
      }),
    ],
    periodicityPricing: [
      {
        __typename: 'PeriodicityPrice',
        periodicity: PaymentPeriodicity.Monthly,
        label: null,
        amountMin: monthlyMin,
        amountTarget: null,
        amountMax: null,
      },
    ],
  });

const yearlyPlan = plan('jahresabo', 'Jahresabo', 700);
const solidarityPlan = plan('solidaritaetsabo', 'Solidaritätsabo', 1250);
const memberPlans = [yearlyPlan, solidarityPlan];

const subscription = subscriptionFixture(
  { memberPlan: yearlyPlan, paymentMethod: payrexx },
  {
    id: 'yearly',
    paymentPeriodicity: PaymentPeriodicity.Yearly,
    paidUntil: '2026-12-31T00:00:00.000Z',
    url: '/profile/subscription/yearly',
    externalReward: 'Gutschein NW-2026',
  }
);

const invoices = [
  invoiceFixture(subscription, {
    id: 'yearly-2026',
    description: 'Jahresabo 2026',
    dueAt: '2026-01-01T00:00:00.000Z',
    paidAt: '2025-12-10T00:00:00.000Z',
  }),
  invoiceFixture(subscription, {
    id: 'yearly-2025',
    description: 'Jahresabo 2025',
    dueAt: '2025-01-01T00:00:00.000Z',
    paidAt: '2024-12-10T00:00:00.000Z',
  }),
  invoiceFixture(subscription, {
    id: 'yearly-2024',
    description: 'Jahresabo 2024',
    dueAt: '2024-01-01T00:00:00.000Z',
    paidAt: '2023-12-10T00:00:00.000Z',
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

const mocks = [
  mockOperation(MemberPlanListDocument, {
    variables: { take: 50, filter: { active: true } },
    maxUsageCount: Number.POSITIVE_INFINITY,
    data: {
      __typename: 'Query',
      memberPlans: {
        __typename: 'PaginatedMemberPlans',
        nodes: memberPlans,
        pageInfo: {
          __typename: 'PageInfo',
          startCursor: null,
          endCursor: null,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        totalCount: memberPlans.length,
      },
    },
  }),
  mockOperation(InvoicesDocument, {
    maxUsageCount: Number.POSITIVE_INFINITY,
    data: { __typename: 'Query', userInvoices: invoices },
  }),
];

const story = (
  overrides: Partial<FullSubscriptionFragment> = {}
): SubscriptionEditFixture => ({
  props: {
    data: { __typename: 'Query', userSubscriptions: [{ ...subscription, ...overrides }] },
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
  mocks,
});

export const Default = story();

export const Cancelled = story({
  autoRenew: false,
  deactivation: {
    __typename: 'SubscriptionDeactivation',
    date: '2026-12-31T00:00:00.000Z',
    reason: SubscriptionDeactivationReason.UserSelfDeactivated,
  },
});

// already on the most expensive plan
export const TopPlan = story({ memberPlan: solidarityPlan });

// the plan offers no other payment method, and the current one can't be renewed
export const PaymentMethodNotChangeable = story({
  memberPlan: plan('jahresabo', 'Jahresabo', 700, [payrexx]),
});
