import {Meta, StoryObj} from '@storybook/react'
import {
  CheckInvoiceStatusDocument,
  Currency,
  Exact,
  FullImageFragment,
  FullInvoiceFragment,
  FullSubscriptionFragment,
  InvoicesDocument,
  PayInvoiceDocument,
  PaymentPeriodicity
} from '@wepublish/website/api'
import {InvoiceListContainer} from './invoice-list-container'

export default {
  component: InvoiceListContainer,
  title: 'Container/InvoiceList'
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
  __typename: 'Subscription',
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
    slug: ''
  },
  memberPlan: {
    __typename: 'MemberPlan',
    image,
    name: 'Foobar Memberplan',
    amountPerMonthMin: 5000,
    availablePaymentMethods: [],
    id: '123',
    slug: '',
    description: [],
    tags: [],
    extendable: true,
    currency: Currency.Chf
  },
  properties: [],
  deactivation: null,
  extendable: true
} as Exact<FullSubscriptionFragment>

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
  paidAt: null
} as Exact<FullInvoiceFragment>

const intent = {
  intentSecret: 'https://example.com'
}

export const Default: StoryObj = {
  args: {},
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: InvoicesDocument
          },
          result: {
            data: {
              invoices: [invoice, {...invoice, id: '4321-4321'}]
            }
          }
        },
        {
          request: {
            query: CheckInvoiceStatusDocument,
            variables: {
              id: invoice.id
            }
          },
          result: {
            data: {
              checkInvoiceStatus: invoice
            }
          }
        },
        {
          request: {
            query: CheckInvoiceStatusDocument,
            variables: {
              id: '4321-4321'
            }
          },
          result: {
            data: {
              checkInvoiceStatus: {...invoice, id: '4321-4321', paidAt: '2023-01-01'}
            }
          }
        },
        {
          request: {
            query: PayInvoiceDocument,
            variables: {
              invoiceId: invoice.id,
              paymentMethodId: subscription.paymentMethod.id
            }
          },
          result: {
            data: {
              createPaymentFromInvoice: intent
            }
          }
        }
      ]
    }
  }
}
