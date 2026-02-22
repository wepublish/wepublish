import { ApolloError } from '@apollo/client';
import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import {
  mockAvailablePaymentMethod,
  mockMemberPlan,
  mockSubscription,
} from '@wepublish/storybook/mocks';
import { WithUserDecorator } from '@wepublish/storybook';
import { wait } from '@wepublish/testing';
import {
  FullMemberPlanFragment,
  PaymentMethod,
  PaymentPeriodicity,
  ProductType,
} from '@wepublish/website/api';
import { Upgrade } from './upgrade';

export default {
  component: Upgrade,
  title: 'Components/Upgrade',
} as Meta<typeof Upgrade>;

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

const memberPlan4 = mockMemberPlan({
  ...memberPlan,
  id: undefined,
  name: 'Donation',
  shortDescription: undefined,
  amountPerMonthMin: 0,
  availablePaymentMethods: [memberPlan.availablePaymentMethods[2]],
  productType: ProductType.Donation,
});

const subscription = mockSubscription({
  memberPlan,
  monthlyAmount: memberPlan.amountPerMonthMin,
  paymentPeriodicity: PaymentPeriodicity.Yearly,
  canExtend: true,
});

const clickPayTransactionFees: StoryObj['play'] = async ({
  canvasElement,
  step,
}) => {
  const canvas = within(canvasElement);
  const transactionFees = canvas.getByText('Bearbeitungsgebühren', {
    exact: false,
  });

  await step('Pay transaction fees', async () => {
    await userEvent.click(transactionFees);
  });
};

const clickUpgrade: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);
  const submitButton = canvas.getByText('Abonnieren', {
    exact: false,
  });

  await step('Submit form', async () => {
    await userEvent.click(submitButton);
  });
};

const changeMemberPlan =
  (plan: FullMemberPlanFragment): NonNullable<StoryObj['play']> =>
  async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    const input = canvas.getByLabelText(plan.name, {
      selector: 'input',
      exact: false,
    });

    await step('Change MemberPlan', async () => {
      await userEvent.click(input);
      await wait(10); // wait for reset to happen
    });
  };

const changePaymentMethod =
  (paymentMethod: PaymentMethod): NonNullable<StoryObj['play']> =>
  async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    const input = canvas.getByLabelText(
      `${paymentMethod.description} ${paymentMethod.name}`
    );

    await step('Change Paymentmethod', async () => {
      await userEvent.click(input);
      await wait(10); // wait for reset to happen
    });
  };

export const Default: StoryObj<typeof Upgrade> = {
  args: {
    subscriptionToUpgrade: subscription,
    memberPlans: {
      data: {
        memberPlans: {
          nodes: [memberPlan, memberPlan2, memberPlan3, memberPlan4],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            __typename: 'PageInfo',
          },
          totalCount: 3,
        },
      },
      loading: false,
    },
    upgradeInfo: {
      data: {
        upgradeUserSubscriptionInfo: {
          discountAmount: 500,
        },
      },
      loading: false,
    },
    onSelect: async (...data) => action('onSelect')(...data),
    onUpgrade: async (...data) => action('onUpgrade')(...data),
  },
  decorators: [WithUserDecorator({} as any)],
};

export const Filled: StoryObj<typeof Upgrade> = {
  ...Default,
  parameters: { chromatic: { disableSnapshot: true } }, // play function relies on i18n text not available in headless Chrome
  play: async ctx => {
    await clickPayTransactionFees(ctx);
  },
};

export const WithUpgradeError: StoryObj<typeof Upgrade> = {
  ...Default,
  args: {
    ...Default.args,
    onUpgrade: (...args: unknown[]) => {
      action('onUpgrade')(args);

      throw new ApolloError({
        errorMessage: 'Something went wrong.',
      });
    },
  },
  parameters: { chromatic: { disableSnapshot: true } }, // play function relies on i18n text not available in headless Chrome
  play: async ctx => {
    await clickUpgrade(ctx);
  },
};

export const ResetPaymentOptionsOnMemberPlanChange: StoryObj<typeof Upgrade> = {
  ...Default,
  parameters: { chromatic: { disableSnapshot: true } }, // play function relies on i18n text not available in headless Chrome
  play: async ctx => {
    await changeMemberPlan(memberPlan3)(ctx);
    await clickUpgrade(ctx);
  },
};

export const ResetPaymentOptionsOnPaymentMethodChange: StoryObj<
  typeof Upgrade
> = {
  ...Default,
  parameters: { chromatic: { disableSnapshot: true } }, // play function relies on faker-generated payment method labels
  play: async ctx => {
    await changePaymentMethod(
      memberPlan.availablePaymentMethods[2].paymentMethods[0]
    )(ctx);
    await clickUpgrade(ctx);
  },
};

export const WithDonate: StoryObj<typeof Upgrade> = {
  ...Default,
  parameters: { chromatic: { disableSnapshot: true } }, // play function relies on i18n text not available in headless Chrome
  play: async ctx => {
    await changeMemberPlan(memberPlan4)(ctx);
  },
};
