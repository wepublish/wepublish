import type { MockLink } from '@apollo/client/testing';
import {
  CreateMemberPlanDocument,
  type CreateMemberPlanMutation,
  type CreateMemberPlanMutationVariables,
  Currency,
  type FullMemberPlanFragment,
  type FullPaymentMethodFragment,
  MemberPlanDocument,
  type MemberPlanQuery,
  PaymentMethodListDocument,
  type PaymentMethodListQuery,
  PaymentPeriodicity,
  ProductType,
  UpdateMemberPlanDocument,
  type UpdateMemberPlanMutation,
  type UpdateMemberPlanMutationVariables,
} from '@wepublish/editor/api';
import { pageListMock } from '@wepublish/form/editor/testing';

type Mock = MockLink.MockedResponse;

const paymentMethod = (
  id: string,
  name: string
): FullPaymentMethodFragment => ({
  __typename: 'PaymentMethod',
  id,
  name,
  slug: id,
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  gracePeriod: 0,
  paymentProvider: {
    __typename: 'PaymentProvider',
    id: 'stripe',
    name: 'Stripe',
  },
  description: '',
  active: true,
  image: null,
});

export const invoice = paymentMethod('pm-invoice', 'Rechnung');
export const card = paymentMethod('pm-card', 'Kreditkarte');

export const storedMemberPlan: FullMemberPlanFragment = {
  __typename: 'MemberPlan',
  id: 'plan-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  name: 'Jahresabo',
  description: null,
  shortDescription: null,
  slug: 'jahresabo',
  active: true,
  productType: ProductType.Subscription,
  tags: ['online'],
  externalReward: null,
  currency: Currency.Chf,
  extendable: true,
  maxCount: null,
  migrateToTargetPaymentMethodID: null,
  defaultPaymentPeriodicity: PaymentPeriodicity.Yearly,
  successPageId: null,
  failPageId: null,
  confirmationPageId: null,
  periodicityPricing: [
    {
      __typename: 'PeriodicityPrice',
      periodicity: PaymentPeriodicity.Monthly,
      label: null,
      amountMin: 1000,
      amountTarget: 1500,
      amountMax: null,
    },
    {
      __typename: 'PeriodicityPrice',
      periodicity: PaymentPeriodicity.Yearly,
      label: '2 Monate gratis',
      amountMin: 10000,
      amountTarget: null,
      amountMax: null,
    },
  ],
  image: null,
  availablePaymentMethods: [
    {
      __typename: 'AvailablePaymentMethod',
      paymentMethods: [invoice],
      paymentPeriodicities: [
        PaymentPeriodicity.Monthly,
        PaymentPeriodicity.Yearly,
      ],
      forceAutoRenewal: false,
    },
  ],
};

export const wireFormat = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export function paymentMethodListMock(
  paymentMethods: FullPaymentMethodFragment[] = [invoice, card]
): Mock {
  const data: PaymentMethodListQuery = { __typename: 'Query', paymentMethods };

  return {
    request: { query: PaymentMethodListDocument },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: { data },
  };
}

export function memberPlanMock(memberPlan: FullMemberPlanFragment): Mock {
  const data: MemberPlanQuery = { __typename: 'Query', memberPlan };

  return {
    request: { query: MemberPlanDocument, variables: { id: memberPlan.id } },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: { data },
  };
}

export function createMemberPlanMock(
  onRequest: (variables: CreateMemberPlanMutationVariables) => void,
  id = 'plan-new'
): Mock {
  return {
    request: { query: CreateMemberPlanDocument, variables: () => true },
    result: (variables: CreateMemberPlanMutationVariables) => {
      onRequest(variables);

      const data: CreateMemberPlanMutation = {
        __typename: 'Mutation',
        createMemberPlan: { ...storedMemberPlan, id },
      };

      return { data };
    },
  };
}

export function updateMemberPlanMock(
  onRequest: (variables: UpdateMemberPlanMutationVariables) => void
): Mock {
  return {
    request: { query: UpdateMemberPlanDocument, variables: () => true },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: (variables: UpdateMemberPlanMutationVariables) => {
      onRequest(variables);

      const data: UpdateMemberPlanMutation = {
        __typename: 'Mutation',
        updateMemberPlan: storedMemberPlan,
      };

      return { data };
    },
  };
}

export function slugTakenMock(
  document: typeof CreateMemberPlanDocument | typeof UpdateMemberPlanDocument
): Mock {
  return {
    request: { query: document, variables: () => true },
    result: {
      errors: [
        {
          message:
            'Unique constraint failed on the constraint: `member.plans_slug_key`',
        },
      ],
    },
  };
}

export const pickerMocks = (): Mock[] => [
  paymentMethodListMock(),
  pageListMock([]),
];
