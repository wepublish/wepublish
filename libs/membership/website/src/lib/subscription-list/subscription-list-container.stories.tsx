import { Meta, StoryObj } from '@storybook/react';
import { SubscriptionListContainer } from './subscription-list-container';
import {
  CancelSubscriptionDocument,
  Currency,
  Exact,
  ExtendSubscriptionDocument,
  FullInvoiceFragment,
  FullSubscriptionDeactivationFragment,
  FullSubscriptionFragment,
  InvoicesDocument,
  PaySubscriptionDocument,
  PaymentPeriodicity,
  Subscription,
  SubscriptionDeactivationReason,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import {
  WithCancelError,
  WithExtendError,
} from './subscription-list-item.stories';
import { waitFor, within } from '@storybook/test';
import { InvoiceListContainer } from '../invoice-list/invoice-list-container';
import { mockImage } from '@wepublish/storybook/mocks';

export default {
  component: SubscriptionListContainer,
  title: 'Container/SubscriptionList',
} as Meta;

const subscription = {
  __typename: 'PublicSubscription',
  id: '1234-1234',
  startsAt: '2023-01-01',
  paidUntil: '2032-01-01',
  autoRenew: true,
  monthlyAmount: 250000,
  paymentPeriodicity: PaymentPeriodicity.Quarterly,
  url: 'https://example.com',
  paymentMethod: {
    __typename: 'PaymentMethod',
    description: '',
    id: '123',
    name: '',
    paymentProviderID: '',
    slug: '',
  },
  memberPlan: {
    __typename: 'MemberPlan',
    image: mockImage(),
    name: 'Foobar Memberplan',
    amountPerMonthMin: 5000,
    availablePaymentMethods: [],
    id: '123',
    slug: '',
    description: [],
    tags: [],
    extendable: true,
    currency: Currency.Chf,
  },
  properties: [],
  deactivation: null,
  extendable: true,
  canExtend: true,
} as Exact<FullSubscriptionFragment>;

const deactivation = {
  __typename: 'SubscriptionDeactivation',
  date: new Date('2023-01-01').toISOString(),
  reason: SubscriptionDeactivationReason.UserSelfDeactivated,
} as Exact<FullSubscriptionDeactivationFragment>;

const invoice = {
  __typename: 'Invoice',
  id: '1234-1234',
  createdAt: '2023-01-01',
  modifiedAt: '2023-01-01',
  dueAt: '2023-01-01',
  subscription,
  subscriptionID: subscription.id,
  items: [],
  mail: 'foobar@example.com',
  total: 50000,
  description: null,
  canceledAt: null,
  paidAt: null,
} as Exact<FullInvoiceFragment>;

const intent = {
  intentSecret: 'https://example.com',
  paymentMethod: {
    paymentProviderID: 'payrexx',
  },
};

export const Default: StoryObj = {
  args: {},
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: SubscriptionsDocument,
          },
          result: {
            data: {
              userSubscriptions: [subscription],
            },
          },
        },
        {
          request: {
            query: InvoicesDocument,
          },
          result: {
            data: {
              userInvoices: [invoice],
            },
          },
        },
        {
          request: {
            query: CancelSubscriptionDocument,
            variables: {
              subscriptionId: subscription.id,
            },
          },
          result: {
            data: {
              cancelUserSubscription: {
                ...subscription,
                canceledAt: new Date('2023-01-01'),
                deactivation,
              },
            },
          },
        },
        {
          request: {
            query: ExtendSubscriptionDocument,
            variables: {
              subscriptionId: subscription.id,
            },
          },
          result: {
            data: {
              extendSubscription: intent,
            },
          },
        },
        {
          request: {
            query: PaySubscriptionDocument,
            variables: {
              subscriptionId: subscription.id,
            },
          },
          result: {
            data: {
              createPaymentFromSubscription: intent,
            },
          },
        },
      ],
    },
  },
};

export const Unpaid: StoryObj = {
  ...Default,
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: SubscriptionsDocument,
          },
          result: {
            data: {
              userSubscriptions: [{ ...subscription, paidUntil: null }],
            },
          },
        },
        {
          request: {
            query: InvoicesDocument,
          },
          result: {
            data: {
              userInvoices: [invoice],
            },
          },
        },
        ...Default.parameters!.apolloClient.mocks.slice(1),
      ],
    },
  },
};

export const WithFilter: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    filter: (subscriptions: Subscription[]) => [],
  },
};

export const Extend: StoryObj = {
  ...Default,
  play: async ctx => {
    const canvas = within(ctx.canvasElement);
    await waitFor(() => canvas.getByText('Jetzt verlängern'));

    await WithExtendError.play?.(ctx);
  },
  parameters: {
    apolloClient: {
      mocks: [
        Default.parameters!.apolloClient.mocks[0],
        {
          request: {
            query: InvoicesDocument,
          },
          result: {
            data: {
              userInvoices: [{ ...invoice, paidAt: new Date('2023-01-01') }],
            },
          },
        },
        ...Default.parameters!.apolloClient.mocks.slice(2),
      ],
    },
  },
};

export const Cancel: StoryObj = {
  ...Default,
  play: async ctx => {
    const canvas = within(ctx.canvasElement);
    await waitFor(() => canvas.getByText('Abo kündigen'));

    await WithCancelError.play?.(ctx);
  },
};

export const CancelWithInvoiceList: StoryObj = {
  ...Cancel,
  render: (args: any) => (
    <>
      <SubscriptionListContainer {...args} />
      <InvoiceListContainer {...args} />
    </>
  ),
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: InvoicesDocument,
          },
          result: {
            data: {
              userInvoices: [invoice],
            },
          },
        },
        ...Cancel.parameters!.apolloClient.mocks,
      ],
    },
  },
};
