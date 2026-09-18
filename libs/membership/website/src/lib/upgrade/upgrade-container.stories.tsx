import { StoryObj } from '@storybook/nextjs-vite';
import {
  MemberPlanListDocument,
  PaymentPeriodicity,
  SubscriptionsDocument,
  UpgradeSubscriptionInfoDocument,
} from '@wepublish/website/api';
import { UpgradeContainer } from './upgrade-container';
import {
  mockAvailablePaymentMethod,
  mockMemberPlan,
  mockSubscription,
} from '@wepublish/storybook/mocks';
import { WithUserDecorator } from '@wepublish/storybook';

export default {
  title: 'Container/Upgrade',
  component: UpgradeContainer,
  decorators: [WithUserDecorator({} as any)],
};

const memberPlan = mockMemberPlan({
  availablePaymentMethods: [
    mockAvailablePaymentMethod({
      forceAutoRenewal: false,
      paymentPeriodicities: [
        PaymentPeriodicity.Monthly,
        PaymentPeriodicity.Quarterly,
        PaymentPeriodicity.Biannual,
        PaymentPeriodicity.Yearly,
        PaymentPeriodicity.Biennial,
        PaymentPeriodicity.Lifetime,
      ],
    }),
    mockAvailablePaymentMethod({
      forceAutoRenewal: false,
      paymentPeriodicities: [PaymentPeriodicity.Lifetime],
    }),
    mockAvailablePaymentMethod({
      forceAutoRenewal: true,
      paymentPeriodicities: [PaymentPeriodicity.Lifetime],
    }),
  ],
});

const memberPlan2 = mockMemberPlan({
  ...memberPlan,
  id: undefined,
  name: undefined,
  shortDescription: undefined,
  periodicityPricing: [
    {
      __typename: 'PeriodicityPrice',
      periodicity: PaymentPeriodicity.Monthly,
      label: null,
      amountMin: 800,
      amountTarget: 800,
      amountMax: null,
    },
  ],
  availablePaymentMethods: [memberPlan.availablePaymentMethods[1]],
});

const memberPlan3 = mockMemberPlan({
  ...memberPlan,
  id: undefined,
  name: undefined,
  shortDescription: undefined,
  periodicityPricing: [
    {
      __typename: 'PeriodicityPrice',
      periodicity: PaymentPeriodicity.Monthly,
      label: null,
      amountMin: 1200,
      amountTarget: 1200,
      amountMax: null,
    },
  ],
  availablePaymentMethods: [memberPlan.availablePaymentMethods[2]],
});

const subscription = mockSubscription({
  memberPlan,
  monthlyAmount:
    memberPlan.periodicityPricing?.find(
      price => price.periodicity === PaymentPeriodicity.Monthly
    )?.amountMin ?? 500,
  paymentPeriodicity: PaymentPeriodicity.Yearly,
  canExtend: true,
});

export const Default: StoryObj<typeof UpgradeContainer> = {
  args: {
    upgradeSubscriptionId: subscription.id,
  },
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: MemberPlanListDocument,
            variables: {
              take: 50,
              filter: {
                active: true,
              },
            },
          },
          result: {
            data: {
              memberPlans: {
                nodes: [memberPlan, memberPlan2, memberPlan3],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  __typename: 'PageInfo',
                },
                totalCount: 3,
              },
            },
          },
        },
        {
          request: {
            query: SubscriptionsDocument,
          },
          result: {
            data: { userSubscriptions: [subscription] },
          },
        },
        {
          request: {
            query: UpgradeSubscriptionInfoDocument,
            variables: {
              memberPlanId: memberPlan2.id,
              subscriptionId: subscription.id,
            },
          },
          result: {
            data: {
              upgradeUserSubscriptionInfo: {
                discountAmount: 500,
                discountPercent: null,
                discountCodeValid: null,
              },
            },
          },
        },
        {
          request: {
            query: UpgradeSubscriptionInfoDocument,
            variables: {
              memberPlanId: memberPlan3.id,
              subscriptionId: subscription.id,
            },
          },
          result: {
            data: {
              upgradeUserSubscriptionInfo: {
                discountAmount: 800,
                discountPercent: null,
                discountCodeValid: null,
              },
            },
          },
        },
      ],
    },
  },
};

export const WithFilter: StoryObj<typeof UpgradeContainer> = {
  ...Default,
  args: {
    ...Default.args,
    filter: memberPlans => memberPlans.filter(mb => mb.id === memberPlan2.id),
  },
};
