import {Meta, StoryObj} from '@storybook/react'
import {SubscriptionListContainer} from './subscription-list-container'
import {css} from '@mui/material'
import {
  CancelSubscriptionDocument,
  Exact,
  ExtendSubscriptionDocument,
  FullImageFragment,
  FullInvoiceFragment,
  FullSubscriptionDeactivationFragment,
  FullSubscriptionFragment,
  InvoicesDocument,
  PaySubscriptionDocument,
  PaymentPeriodicity,
  Subscription,
  SubscriptionDeactivationReason,
  SubscriptionsDocument
} from '@wepublish/website/api'
import {WithCancelError, WithExtendError, WithPayError} from './subscription-list-item.stories'
import {waitFor, within} from '@storybook/testing-library'
import {InvoiceListContainer} from '../invoice-list/invoice-list-container'

export default {
  component: SubscriptionListContainer,
  title: 'Container/SubscriptionList'
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
  deactivation: null
} as Exact<FullSubscriptionFragment>

const deactivation = {
  __typename: 'SubscriptionDeactivation',
  date: new Date('2023-01-01').toISOString(),
  reason: SubscriptionDeactivationReason.UserSelfDeactivated
} as Exact<FullSubscriptionDeactivationFragment>

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
  paidAt: null
} as Exact<FullInvoiceFragment>

const intent = {
  intentSecret: 'https://example.com',
  paymentMethod: {
    paymentProviderID: 'payrexx'
  }
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
            query: SubscriptionsDocument
          },
          result: {
            data: {
              subscriptions: [subscription]
            }
          }
        },
        {
          request: {
            query: InvoicesDocument
          },
          result: {
            data: {
              invoices: [invoice]
            }
          }
        },
        {
          request: {
            query: CancelSubscriptionDocument,
            variables: {
              subscriptionId: subscription.id
            }
          },
          result: {
            data: {
              cancelUserSubscription: {
                ...subscription,
                canceledAt: new Date('2023-01-01'),
                deactivation
              }
            }
          }
        },
        {
          request: {
            query: ExtendSubscriptionDocument,
            variables: {
              subscriptionId: subscription.id,
              successURL: '/payment/success',
              failureURL: '/payment/fail'
            }
          },
          result: {
            data: {
              extendSubscription: intent
            }
          }
        },
        {
          request: {
            query: PaySubscriptionDocument,
            variables: {
              subscriptionId: subscription.id,
              successURL: '/payment/success',
              failureURL: '/payment/fail'
            }
          },
          result: {
            data: {
              createPaymentFromSubscription: intent
            }
          }
        }
      ]
    }
  }
}

export const Unpaid: StoryObj = {
  ...Default,
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: SubscriptionsDocument
          },
          result: {
            data: {
              subscriptions: [{...subscription, paidUntil: null}]
            }
          }
        },
        {
          request: {
            query: InvoicesDocument
          },
          result: {
            data: {
              invoices: [invoice]
            }
          }
        },
        ...Default.parameters!.apolloClient.mocks.slice(2)
      ]
    }
  }
}

export const WithFilter: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    filter: (subscriptions: Subscription[]) => []
  }
}

export const Pay: StoryObj = {
  ...Unpaid,
  play: async ctx => {
    const canvas = within(ctx.canvasElement)
    await waitFor(() => canvas.getByText('Jetzt Bezahlen'))

    await WithPayError.play?.(ctx)
  }
}

export const Extend: StoryObj = {
  ...Default,
  play: async ctx => {
    const canvas = within(ctx.canvasElement)
    await waitFor(() => canvas.getByText('Jetzt Verlängern'))

    await WithExtendError.play?.(ctx)
  },
  parameters: {
    apolloClient: {
      mocks: [
        Default.parameters!.apolloClient.mocks[0],
        {
          request: {
            query: InvoicesDocument
          },
          result: {
            data: {
              invoices: [{...invoice, paidAt: new Date('2023-01-01')}]
            }
          }
        },
        ...Default.parameters!.apolloClient.mocks.slice(2)
      ]
    }
  }
}

export const Cancel: StoryObj = {
  ...Default,
  play: async ctx => {
    const canvas = within(ctx.canvasElement)
    await waitFor(() => canvas.getByText('Abo Künden'))

    await WithCancelError.play?.(ctx)
  }
}

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
            query: InvoicesDocument
          },
          result: {
            data: {
              invoices: [invoice]
            }
          }
        },
        ...Cancel.parameters!.apolloClient.mocks
      ]
    }
  }
}

export const WithClassName: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}

export const WithEmotion: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    css: css`
      background-color: #eee;
    `
  }
}
