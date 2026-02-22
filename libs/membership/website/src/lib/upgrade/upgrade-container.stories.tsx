import { StoryObj } from '@storybook/react';
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
  amountPerMonthMin: 800,
  amountPerMonthTarget: 800,
  availablePaymentMethods: [memberPlan.availablePaymentMethods[1]],
});

const memberPlan3 = mockMemberPlan({
  ...memberPlan,
  id: undefined,
  name: undefined,
  shortDescription: undefined,
  amountPerMonthMin: 1200,
  amountPerMonthTarget: 1200,
  availablePaymentMethods: [memberPlan.availablePaymentMethods[2]],
});

const subscription = mockSubscription({
  memberPlan,
  monthlyAmount: memberPlan.amountPerMonthMin,
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
