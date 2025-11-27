import { ApolloError } from '@apollo/client';
import { action } from '@storybook/addon-actions';
import { Meta } from '@storybook/react';
import { SubscriptionList } from './subscription-list';
import {
  Exact,
  FullInvoiceFragment,
  FullSubscriptionFragment,
  PaymentPeriodicity,
} from '@wepublish/website/api';
import { mockMemberPlan, mockPaymentMethod } from '@wepublish/storybook/mocks';

export default {
  component: SubscriptionList,
  title: 'Components/SubscriptionList',
} as Meta;

const subscription = {
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
  extendable: true,
  canExtend: true,
  properties: [],
} as Exact<FullSubscriptionFragment>;

const invoice = {
  id: '4321-4321',
  createdAt: '2023-01-01',
  modifiedAt: '2023-01-01',
  dueAt: '2023-01-01',
  mail: 'foobar@example.com',
  total: 500,
  items: [],
  subscription,
  subscriptionID: subscription.id,
} as Exact<FullInvoiceFragment>;

export const Default = {
  args: {
    data: {
      subscriptions: [
        { ...subscription, id: '1' },
        { ...subscription, id: '2' },
        { ...subscription, id: '3' },
        { ...subscription, id: '4' },
      ],
    },
    invoices: {
      data: {
        invoices: [
          { ...invoice, id: '1', subscriptionID: '1' },
          {
            ...invoice,
            id: '2',
            subscriptionID: '2',
            paidAt: new Date('2023-04-04').toISOString(),
          },
          {
            ...invoice,
            id: '3',
            subscriptionID: '3',
            canceledAt: new Date('2023-04-04').toISOString(),
          },
          {
            ...invoice,
            id: '4',
            subscriptionID: '4',
            paidAt: new Date('2023-04-04').toISOString(),
          },
        ],
      },
    },
    subscribeUrl: '/mitmachen',
    onPay: action('onPay'),
    onCancel: action('onCancel'),
    onExtend: action('onExtend'),
  },
};

export const WithPayrexxSubscriptionsWorkaround = {
  ...Default,
  args: {
    ...Default.args,
    data: {
      subscriptions: [
        {
          ...subscription,
          id: '1',
          paymentMethod: {
            slug: 'payrexx-subscription',
          },
        },
        {
          ...subscription,
          id: '2',
          paymentMethod: {
            slug: 'payrexx-subscription',
          },
        },
      ],
    },
  },
};

export const Empty = {
  args: {
    ...Default.args,
    data: {
      subscriptions: [],
    },
  },
};

export const WithLoading = {
  args: {
    ...Default.args,
    data: undefined,
    loading: true,
  },
};

export const WithError = {
  args: {
    ...Default.args,
    data: undefined,
    loading: false,
    error: new ApolloError({
      errorMessage: 'Foobar',
    }),
  },
};

export const WithoutImage = {
  args: {
    ...Default.args,
    data: {
      subscriptions: [
        { ...subscription, id: '1' },
        { ...subscription, id: '2', image: null },
        { ...subscription, id: '3' },
        { ...subscription, id: '4', image: null },
      ],
    },
  },
};
