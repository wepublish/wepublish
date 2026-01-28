import {
  Currency,
  Exact,
  FullSubscriptionFragment,
  PaymentPeriodicity,
  SubscriptionDeactivationReason,
} from '@wepublish/website/api';
import { SubscriptionListItem } from './subscription-list-item';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { userEvent, within } from '@storybook/test';
import { ApolloError } from '@apollo/client';
import { mockMemberPlan } from '@wepublish/storybook/mocks';

export default {
  component: SubscriptionListItem,
  title: 'Components/SubscriptionList/Item',
} as Meta;

const clickCancel: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const button = canvas.getByText('Abo kündigen', {
    selector: 'button',
  });

  await step('Click Cancel', async () => {
    await userEvent.click(button);
  });

  /* Works fine in the browser but does not work in the terminal
  // Mui sets the portal outside of the story root, so we have to escape it
  const body = canvasElement.ownerDocument.body
  const modal = within(body)

  const modalButton = modal.getByText('Abo kündigen', {
    selector: '[role="presentation"] button'
  })

  await step('Confirm Cancel', async () => {
    await userEvent.click(modalButton)
  })
   */
};

const clickExtend: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const button = canvas.getByText('Jetzt verlängern', {
    selector: 'button',
  });

  await step('Click Extend', async () => {
    await userEvent.click(button);
  });
};

const subscription = {
  id: '1234-1234',
  startsAt: '2023-01-01',
  paidUntil: '2032-01-01',
  autoRenew: true,
  monthlyAmount: 250000,
  paymentPeriodicity: PaymentPeriodicity.Quarterly,
  url: 'https://example.com',
  paymentMethod: {},
  memberPlan: mockMemberPlan(),
  extendable: true,
} as Exact<FullSubscriptionFragment>;

export const Default: StoryObj = {
  args: {
    ...subscription,
    pay: action('pay'),
    cancel: action('cancel'),
    canExtend: true,
    canPay: false,
    extend: action('extend'),
  },
};

export const Unpaid: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    paidUntil: null,
    canPay: true,
    canExtend: false,
  },
};

export const RenewMonthly: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    paymentPeriodicity: PaymentPeriodicity.Monthly,
  },
};

export const RenewMonthlyManually: StoryObj = {
  ...RenewMonthly,
  args: {
    ...RenewMonthly.args,
    autoRenew: false,
  },
};

export const RenewQuarterly: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    paymentPeriodicity: PaymentPeriodicity.Quarterly,
  },
};

export const RenewQuarterlyManually: StoryObj = {
  ...RenewQuarterly,
  args: {
    ...RenewQuarterly.args,
    autoRenew: false,
  },
};

export const RenewBianual: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    paymentPeriodicity: PaymentPeriodicity.Biannual,
  },
};

export const RenewBianualManually: StoryObj = {
  ...RenewBianual,
  args: {
    ...RenewBianual.args,
    autoRenew: false,
  },
};

export const RenewYearly: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    paymentPeriodicity: PaymentPeriodicity.Yearly,
  },
};

export const RenewYearlyManually: StoryObj = {
  ...RenewYearly,
  args: {
    ...RenewYearly.args,
    autoRenew: false,
  },
};

export const RenewBiennial: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    paymentPeriodicity: PaymentPeriodicity.Biennial,
  },
};

export const RenewBiennialManually: StoryObj = {
  ...RenewBiennial,
  args: {
    ...RenewBiennial.args,
    autoRenew: false,
  },
};

export const RenewLifetime: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    paymentPeriodicity: PaymentPeriodicity.Lifetime,
  },
};

export const RenewLifetimeManually: StoryObj = {
  ...RenewLifetime,
  args: {
    ...RenewLifetime.args,
    autoRenew: false,
  },
};

export const DeactivatedCancelled: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    deactivation: {
      date: '2023-01-01',
      reason: SubscriptionDeactivationReason.UserSelfDeactivated,
    },
  },
};

export const DeactivatedUnpaid: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    deactivation: {
      date: '2023-01-01',
      reason: SubscriptionDeactivationReason.InvoiceNotPaid,
    },
  },
};

export const DeactivatedUnknown: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    deactivation: {
      date: '2023-01-01',
      reason: SubscriptionDeactivationReason.None,
    },
  },
};

export const WithCancelLoading: StoryObj = {
  args: {
    ...Unpaid.args,
    cancel: (...args: unknown[]) => {
      action('cancel')(args);

      return new Promise(() => {
        // never resolve
      });
    },
  },
  play: clickCancel,
};

export const WithCancelError: StoryObj = {
  args: {
    ...Unpaid.args,
    cancel: (...args: unknown[]) => {
      action('cancel')(args);

      throw new ApolloError({
        errorMessage: 'Foobar',
      });
    },
  },
  play: clickCancel,
};

export const WithExtendLoading: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    extend: (...args: unknown[]) => {
      action('extend')(args);

      return new Promise(() => {
        // never resolve
      });
    },
  },
  play: clickExtend,
};

export const WithExtendError: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    extend: (...args: unknown[]) => {
      action('extend')(args);

      throw new ApolloError({
        errorMessage: 'Foobar',
      });
    },
  },
  play: clickExtend,
};

export const WithCurrency: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    subscription: {
      ...subscription,
      memberPlan: {
        ...subscription.memberPlan,
        currency: Currency.Eur,
      },
    },
  },
};

export const WithExternalReward: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    subscription: {
      ...subscription,
      externalReward: 'API Token: <FOOBAR>',
    },
  },
};

export const WithExternalRewardLink: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    subscription: {
      ...subscription,
      externalReward: 'https://example.com',
    },
  },
};
