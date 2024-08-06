import {
  Currency,
  Exact,
  FullImageFragment,
  FullSubscriptionFragment,
  PaymentPeriodicity,
  SubscriptionDeactivationReason
} from '@wepublish/website/api'
import {SubscriptionListItem} from './subscription-list-item'
import {Meta, StoryObj} from '@storybook/react'
import {action} from '@storybook/addon-actions'
import {css} from '@emotion/react'
import {userEvent, within} from '@storybook/testing-library'
import {ApolloError} from '@apollo/client'

export default {
  component: SubscriptionListItem,
  title: 'Components/SubscriptionList/Item'
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

const clickCancel: StoryObj['play'] = async ({canvasElement, step}) => {
  const canvas = within(canvasElement)

  const button = canvas.getByText('Abo Künden', {
    selector: 'button'
  })

  await step('Click Cancel', async () => {
    await userEvent.click(button)
  })

  /* Works fine in the browser but does not work in the terminal
  // Mui sets the portal outside of the story root, so we have to escape it
  const body = canvasElement.ownerDocument.body
  const modal = within(body)

  const modalButton = modal.getByText('Abo Künden', {
    selector: '[role="presentation"] button'
  })

  await step('Confirm Cancel', async () => {
    await userEvent.click(modalButton)
  })
   */
}

const clickExtend: StoryObj['play'] = async ({canvasElement, step}) => {
  const canvas = within(canvasElement)

  const button = canvas.getByText('Jetzt Verlängern', {
    selector: 'button'
  })

  await step('Click Extend', async () => {
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
    extendable: true,
    currency: Currency.Chf
  },
  extendable: true
} as Exact<FullSubscriptionFragment>

export const Default: StoryObj = {
  args: {
    ...subscription,
    pay: action('pay'),
    cancel: action('cancel'),
    canExtend: true,
    canPay: false,
    extend: action('extend')
  }
}

export const Unpaid: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    paidUntil: null,
    canPay: true,
    canExtend: false
  }
}

export const RenewMonthly: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    paymentPeriodicity: PaymentPeriodicity.Monthly
  }
}

export const RenewMonthlyManually: StoryObj = {
  ...RenewMonthly,
  args: {
    ...RenewMonthly.args,
    autoRenew: false
  }
}

export const RenewQuarterly: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    paymentPeriodicity: PaymentPeriodicity.Quarterly
  }
}

export const RenewQuarterlyManually: StoryObj = {
  ...RenewQuarterly,
  args: {
    ...RenewQuarterly.args,
    autoRenew: false
  }
}

export const RenewBianual: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    paymentPeriodicity: PaymentPeriodicity.Biannual
  }
}

export const RenewBianualManually: StoryObj = {
  ...RenewBianual,
  args: {
    ...RenewBianual.args,
    autoRenew: false
  }
}

export const RenewYearly: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    paymentPeriodicity: PaymentPeriodicity.Yearly
  }
}

export const RenewYearlyManually: StoryObj = {
  ...RenewYearly,
  args: {
    ...RenewYearly.args,
    autoRenew: false
  }
}

export const DeactivatedCancelled: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    deactivation: {
      date: '2023-01-01',
      reason: SubscriptionDeactivationReason.UserSelfDeactivated
    }
  }
}

export const DeactivatedUnpaid: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    deactivation: {
      date: '2023-01-01',
      reason: SubscriptionDeactivationReason.InvoiceNotPaid
    }
  }
}

export const DeactivatedUnknown: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    deactivation: {
      date: '2023-01-01',
      reason: SubscriptionDeactivationReason.None
    }
  }
}

export const WithCancelLoading: StoryObj = {
  args: {
    ...Unpaid.args,
    cancel: (...args: unknown[]) => {
      action('cancel')(args)

      return new Promise(() => {
        // never resolve
      })
    }
  },
  play: clickCancel
}

export const WithCancelError: StoryObj = {
  args: {
    ...Unpaid.args,
    cancel: (...args: unknown[]) => {
      action('cancel')(args)

      throw new ApolloError({
        errorMessage: 'Foobar'
      })
    }
  },
  play: clickCancel
}

export const WithPayLoading: StoryObj = {
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

export const WithExtendLoading: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    extend: (...args: unknown[]) => {
      action('extend')(args)

      return new Promise(() => {
        // never resolve
      })
    }
  },
  play: clickExtend
}

export const WithExtendError: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    extend: (...args: unknown[]) => {
      action('extend')(args)

      throw new ApolloError({
        errorMessage: 'Foobar'
      })
    }
  },
  play: clickExtend
}

export const WithCurrency: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    subscription: {
      ...subscription,
      memberPlan: {
        ...subscription.memberPlan,
        currency: Currency.Eur
      }
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
