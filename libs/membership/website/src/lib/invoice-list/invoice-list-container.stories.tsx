import { Meta, StoryObj } from '@storybook/react';
import {
  CheckInvoiceStatusDocument,
  Currency,
  Exact,
  FullInvoiceFragment,
  FullSubscriptionFragment,
  InvoicesDocument,
  PayInvoiceDocument,
  PaymentPeriodicity,
} from '@wepublish/website/api';
import { InvoiceListContainer } from './invoice-list-container';
import { mockImage } from '@wepublish/storybook/mocks';

export default {
  component: InvoiceListContainer,
  title: 'Container/InvoiceList',
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
  description: '',
  canceledAt: null,
  paidAt: null,
} as Exact<FullInvoiceFragment>;

const intent = {
  intentSecret: 'https://example.com',
};

export const Default: StoryObj = {
  args: {},
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: InvoicesDocument,
          },
          result: {
            data: {
              userInvoices: [invoice, { ...invoice, id: '4321-4321' }],
            },
          },
        },
        {
          request: {
            query: CheckInvoiceStatusDocument,
            variables: {
              id: invoice.id,
            },
          },
          result: {
            data: {
              checkInvoiceStatus: invoice,
            },
          },
        },
        {
          request: {
            query: CheckInvoiceStatusDocument,
            variables: {
              id: '4321-4321',
            },
          },
          result: {
            data: {
              checkInvoiceStatus: {
                ...invoice,
                id: '4321-4321',
                paidAt: '2023-01-01',
              },
            },
          },
        },
        {
          request: {
            query: PayInvoiceDocument,
            variables: {
              invoiceId: invoice.id,
              paymentMethodId: subscription.paymentMethod.id,
            },
          },
          result: {
            data: {
              createPaymentFromInvoice: intent,
            },
          },
        },
      ],
    },
  },
};
