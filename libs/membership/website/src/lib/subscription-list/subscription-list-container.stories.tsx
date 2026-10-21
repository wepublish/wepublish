import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SubscriptionListContainer } from './subscription-list-container';
import {
  CancelSubscriptionDocument,
  CancelSubscriptionPaymentMethodChangeDocument,
  ChangeSubscriptionPaymentMethodDocument,
  CheckSubscriptionPaymentMethodChangeDocument,
  Currency,
  FullSubscriptionPaymentMethodChangeFragment,
  PaymentMethodChangeKind,
  PaymentMethodChangeState,
  ReactivateSubscriptionDocument,
  Exact,
  ExtendSubscriptionDocument,
  FullInvoiceFragment,
  FullSubscriptionDeactivationFragment,
  FullSubscriptionFragment,
  InvoicesDocument,
  PaySubscriptionDocument,
  PaymentPeriodicity,
  SubscriptionDeactivationReason,
  SubscriptionsDocument,
} from '@wepublish/website/api';

import {
  mockAvailablePaymentMethod,
  mockMemberPlan,
  mockPaymentMethod,
} from '@wepublish/storybook/mocks';
import { InvoiceListContainer } from '../invoice-list/invoice-list-container';
import { waitFor, within } from 'storybook/test';
import {
  WithCancelError,
  WithExtendError,
} from './subscription-list-item.stories';

export default {
  component: SubscriptionListContainer,
  title: 'Container/SubscriptionList',
} as Meta;

const subscription = {
  __typename: 'PublicSubscription',
  id: '1234-1234',
  isActive: true,
  startsAt: '2023-01-01',
  paidUntil: '2032-01-01',
  autoRenew: true,
  monthlyAmount: 250000,
  paymentPeriodicity: PaymentPeriodicity.Quarterly,
  url: 'https://example.com',
  paymentMethod: mockPaymentMethod(),
  memberPlan: mockMemberPlan(),
  properties: [],
  deactivation: null,
  extendable: true,
  canExtend: true,
  canRevertUpgrade: false,
  goodie: null,
  externalReward: 'https://example.com/external-reward-mock-url',
  pendingPaymentMethodChange: null,
  canRenewPaymentMethod: false,
  // `satisfies`, not `as`: a field missing here leaves the subscription
  // incomplete in the cache, and Apollo refetches it from a mock that is used up.
} satisfies Exact<FullSubscriptionFragment>;

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
  canceledAt: '2023-01-01',
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
            query: ReactivateSubscriptionDocument,
            variables: {
              subscriptionId: subscription.id,
            },
          },
          result: {
            data: {
              reactivateUserSubscription: {
                ...subscription,
                deactivation: null,
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
    filter: (subscriptions: FullSubscriptionFragment[]) => [],
  },
};

export const Extend: StoryObj = {
  ...Default,
  play: async ctx => {
    const canvas = within(ctx.canvasElement);
    await waitFor(() => canvas.getByText('Jetzt verlängern'), {
      timeout: 5000,
    });

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
    await waitFor(() => canvas.getByText('Abo kündigen'), {
      timeout: 5000,
    });

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

const invoicePaymentMethod = mockPaymentMethod({
  id: 'invoice',
  name: 'Rechnung',
  description: 'Per Post',
  paymentProviderID: 'bexio',
});

const onlinePaymentMethod = mockPaymentMethod({
  id: 'online',
  name: 'Online',
  description: 'Karte, TWINT',
  paymentProviderID: 'payrexx',
});

const changeableSubscription = {
  ...subscription,
  canExtend: false,
  paymentPeriodicity: PaymentPeriodicity.Yearly,
  paymentMethod: invoicePaymentMethod,
  memberPlan: mockMemberPlan({
    availablePaymentMethods: [
      mockAvailablePaymentMethod({
        paymentPeriodicities: [PaymentPeriodicity.Yearly],
        paymentMethods: [invoicePaymentMethod, onlinePaymentMethod],
      }),
    ],
  }),
} satisfies Exact<FullSubscriptionFragment>;

const pendingChange = (
  state = PaymentMethodChangeState.Pending
): Exact<FullSubscriptionPaymentMethodChangeFragment> => ({
  __typename: 'SubscriptionPaymentMethodChange',
  id: 'change-1',
  createdAt: '2026-10-21T10:00:00.000Z',
  kind: PaymentMethodChangeKind.Authorization,
  state,
  amount: 1,
  currency: Currency.Chf,
  expiresAt: '2026-11-04T10:00:00.000Z',
  completedAt: null,
  paymentMethod: onlinePaymentMethod,
});

const subscriptionsMock = (subscriptions: FullSubscriptionFragment[]) => ({
  request: {
    query: SubscriptionsDocument,
  },
  result: {
    data: {
      userSubscriptions: subscriptions,
    },
  },
});

const noInvoicesMock = {
  request: {
    query: InvoicesDocument,
  },
  result: {
    data: {
      userInvoices: [],
    },
  },
};

export const ChangePaymentMethod: StoryObj = {
  ...Default,
  parameters: {
    apolloClient: {
      mocks: [
        subscriptionsMock([changeableSubscription]),
        noInvoicesMock,
        {
          request: {
            query: ChangeSubscriptionPaymentMethodDocument,
          },
          variableMatcher: () => true,
          result: {
            data: {
              changeSubscriptionPaymentMethod: {
                __typename: 'StartedSubscriptionPaymentMethodChange',
                change: {
                  ...pendingChange(PaymentMethodChangeState.Completed),
                  kind: PaymentMethodChangeKind.Immediate,
                },
                intentSecret: null,
                paymentProviderID: 'bexio',
              },
            },
          },
        },
        subscriptionsMock([
          { ...changeableSubscription, paymentMethod: onlinePaymentMethod },
        ]),
      ],
    },
  },
};

export const PaymentMethodChangePending: StoryObj = {
  ...Default,
  parameters: {
    apolloClient: {
      mocks: [
        subscriptionsMock([
          {
            ...changeableSubscription,
            pendingPaymentMethodChange: pendingChange(),
          },
        ]),
        noInvoicesMock,
        {
          request: {
            query: CheckSubscriptionPaymentMethodChangeDocument,
            variables: { id: 'change-1' },
          },
          result: {
            data: {
              checkSubscriptionPaymentMethodChange: pendingChange(),
            },
          },
        },
        {
          request: {
            query: CancelSubscriptionPaymentMethodChangeDocument,
            variables: { id: 'change-1' },
          },
          result: {
            data: {
              cancelSubscriptionPaymentMethodChange: pendingChange(
                PaymentMethodChangeState.Canceled
              ),
            },
          },
        },
        subscriptionsMock([changeableSubscription]),
      ],
    },
  },
};

export const PaymentMethodChangeCompletedMeanwhile: StoryObj = {
  ...Default,
  parameters: {
    apolloClient: {
      mocks: [
        subscriptionsMock([
          {
            ...changeableSubscription,
            pendingPaymentMethodChange: pendingChange(),
          },
        ]),
        noInvoicesMock,
        {
          request: {
            query: CheckSubscriptionPaymentMethodChangeDocument,
            variables: { id: 'change-1' },
          },
          result: {
            data: {
              checkSubscriptionPaymentMethodChange: pendingChange(
                PaymentMethodChangeState.Completed
              ),
            },
          },
        },
        subscriptionsMock([
          { ...changeableSubscription, paymentMethod: onlinePaymentMethod },
        ]),
      ],
    },
  },
};
