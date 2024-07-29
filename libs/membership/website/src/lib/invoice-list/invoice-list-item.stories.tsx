import {
  Exact,
  FullImageFragment,
  FullInvoiceFragment,
  PaymentPeriodicity,
  FullSubscriptionFragment
} from '@wepublish/website/api'
import {InvoiceListItem} from './invoice-list-item'
import {Meta, StoryObj} from '@storybook/react'
import {action} from '@storybook/addon-actions'
import {css} from '@emotion/react'
import {userEvent, within} from '@storybook/testing-library'
import {ApolloError} from '@apollo/client'

export default {
  component: InvoiceListItem,
  title: 'Components/InvoiceList/Item'
} as Meta

const clickPay: StoryObj['play'] = async ({canvasElement, step}) => {
  const canvas = within(canvasElement)

  const button = canvas.getByText('Jetzt Bezahlen', {
    selector: 'button'
  })

  await step('Click Pay', async () => {
    await userEvent.click(button)
  })
}

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
    name: 'Foobar Memberplan',
    extendable: true
  },
  extendable: true
} as Exact<FullSubscriptionFragment>

const invoice = {
  id: '4321-4321',
  createdAt: '2023-01-01',
  modifiedAt: '2023-01-01',
  dueAt: '2023-01-01',
  paidAt: '2023-01-01',
  mail: 'foobar@example.com',
  total: 500,
  items: [],
  subscription,
  subscriptionID: subscription.id
} as Exact<FullInvoiceFragment>

export const Default: StoryObj = {
  args: {
    ...invoice,
    canPay: false,
    pay: action('pay')
  }
}

export const Unpaid: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    paidAt: null,
    canPay: true
  }
}

export const Canceled: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    paidAt: null,
    canceledAt: '2023-01-01'
  }
}

export const WithPayLoading: StoryObj = {
  ...Unpaid,
  args: {
    ...Unpaid.args,
    pay: (...args: unknown[]) => {
      action('pay')(args)

      return new Promise(() => {
        // never resolve
      })
    }
  },
  play: clickPay
}

export const WithPayError: StoryObj = {
  ...Unpaid,
  args: {
    ...Unpaid.args,
    pay: (...args: unknown[]) => {
      action('pay')(args)

      throw new ApolloError({
        errorMessage: 'Foobar'
      })
    }
  },
  play: clickPay
}

export const WithPayrexxSubscriptionsWarning: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    paidAt: null,
    canceledAt: null,
    subscription: {
      ...subscription,
      paymentMethod: {
        slug: 'payrexx-subscription'
      }
    }
  }
}

export const WithClassName: StoryObj = {
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}

export const WithEmotion: StoryObj = {
  args: {
    ...Default.args,
    css: css`
      background-color: #eee;
    `
  }
}
