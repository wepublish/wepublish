import {ApolloError} from '@apollo/client'
import {action} from '@storybook/addon-actions'
import {Meta} from '@storybook/react'
import {InvoiceList} from './invoice-list'
import {
  Currency,
  Exact,
  FullInvoiceFragment,
  FullSubscriptionFragment,
  PaymentPeriodicity
} from '@wepublish/website/api'
import {mockImage} from '@wepublish/storybook/mocks'

export default {
  component: InvoiceList,
  title: 'Components/InvoiceList'
} as Meta

const subscription = {
  id: '1234-1234',
  startsAt: '2023-01-01',
  paidUntil: '2032-01-01',
  autoRenew: true,
  monthlyAmount: 250000,
  paymentPeriodicity: PaymentPeriodicity.Quarterly,
  url: 'https://example.com',
  paymentMethod: {},
  memberPlan: {
    image: mockImage(),
    name: 'Foobar Memberplan',
    currency: Currency.Chf
  }
} as Exact<FullSubscriptionFragment>

const invoice = {
  id: '4321-4321',
  createdAt: '2023-01-01',
  modifiedAt: '2023-01-01',
  dueAt: '2023-01-01',
  mail: 'foobar@example.com',
  total: 500,
  items: [],
  subscription,
  subscriptionID: subscription.id
} as Exact<FullInvoiceFragment>

export const Default = {
  args: {
    data: {
      invoices: [
        {...invoice, id: '1'},
        {...invoice, id: '2'},
        {...invoice, id: '3'},
        {...invoice, id: '4'}
      ]
    },
    onPay: action('onPay')
  }
}

export const Empty = {
  args: {
    ...Default.args,
    data: {
      invoices: []
    }
  }
}

export const WithLoading = {
  args: {
    ...Default.args,
    data: undefined,
    loading: true
  }
}

export const WithError = {
  args: {
    ...Default.args,
    data: undefined,
    loading: false,
    error: new ApolloError({
      errorMessage: 'Foobar'
    })
  }
}
