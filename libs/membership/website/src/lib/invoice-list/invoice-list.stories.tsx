import {ApolloError} from '@apollo/client'
import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'
import {Meta} from '@storybook/react'
import {InvoiceList} from './invoice-list'
import {
  Exact,
  FullImageFragment,
  FullInvoiceFragment,
  FullSubscriptionFragment,
  PaymentPeriodicity
} from '@wepublish/website/api'

export default {
  component: InvoiceList,
  title: 'Components/InvoiceList'
} as Meta

const image = {
  __typename: 'Image',
  id: 'ljh9FHAvHAs0AxC',
  mimeType: 'image/jpg',
  format: 'jpg',
  createdAt: '2023-04-18T12:38:56.369Z',
  modifiedAt: '2023-04-18T12:38:56.371Z',
  filename: 'DSC07717',
  extension: '.JPG',
  width: 4000,
  height: 6000,
  fileSize: 8667448,
  description: null,
  tags: [],
  source: null,
  link: null,
  license: null,
  focalPoint: {
    x: 0.5,
    y: 0.5
  },
  title: null,
  url: 'https://unsplash.it/500/281',
  xl: 'https://unsplash.it/1200/400',
  l: 'https://unsplash.it/1000/400',
  m: 'https://unsplash.it/800/400',
  s: 'https://unsplash.it/500/300',
  xs: 'https://unsplash.it/300/200',
  xxs: 'https://unsplash.it/200/100',
  xlSquare: 'https://unsplash.it/1200/1200',
  lSquare: 'https://unsplash.it/1000/1000',
  mSquare: 'https://unsplash.it/800/800',
  sSquare: 'https://unsplash.it/500/500',
  xsSquare: 'https://unsplash.it/300/300',
  xxsSquare: 'https://unsplash.it/200/200'
} as FullImageFragment

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
    image,
    name: 'Foobar Memberplan'
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

export const WithClassName = {
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    ...Default.args,
    css: css`
      background-color: #eee;
    `
  }
}
