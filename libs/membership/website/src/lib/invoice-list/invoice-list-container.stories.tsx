import {Meta, StoryObj} from '@storybook/react'
import {
  CheckInvoiceStatusDocument,
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
  bigURL: 'https://unsplash.it/800/400',
  largeURL: 'https://unsplash.it/500/300',
  mediumURL: 'https://unsplash.it/300/200',
  smallURL: 'https://unsplash.it/200/100',
  squareBigURL: 'https://unsplash.it/800/800',
  squareLargeURL: 'https://unsplash.it/500/500',
  squareMediumURL: 'https://unsplash.it/300/300',
  squareSmallURL: 'https://unsplash.it/200/200'
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
    extendable: true
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
  args: {
    successURL: '/payment/success',
    failureURL: '/payment/fail'
  },
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
              paymentMethodId: subscription.paymentMethod.id,
              successURL: '/payment/success',
              failureURL: '/payment/fail'
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
