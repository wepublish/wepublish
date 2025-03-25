import {
  Exact,
  FullInvoiceFragment,
  PaymentPeriodicity,
  FullSubscriptionFragment,
  Currency
} from '@wepublish/website/api'
import {InvoiceListItem} from './invoice-list-item'
import {Meta, StoryObj} from '@storybook/react'
import {action} from '@storybook/addon-actions'
import {userEvent, within} from '@storybook/testing-library'
import {ApolloError} from '@apollo/client'
import {mockImage} from '@wepublish/storybook/mocks'

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
    extendable: true,
    currency: Currency.Chf
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

export const WithCurrency: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    invoice: {
      ...invoice,
      subscription: {
        ...invoice.subscription,
        memberPlan: {
          ...invoice.subscription!.memberPlan,
          currency: Currency.Eur
        }
      }
    }
  }
}
