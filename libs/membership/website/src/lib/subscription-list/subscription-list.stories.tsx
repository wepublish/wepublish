import {ApolloError} from '@apollo/client'
import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'
import {Meta} from '@storybook/react'
import {SubscriptionList} from './subscription-list'
import {
  Exact,
  FullImageFragment,
  FullSubscriptionFragment,
  PaymentPeriodicity
} from '@wepublish/website/api'

export default {
  component: SubscriptionList,
  title: 'Components/SubscriptionList'
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

export const Default = {
  args: {
    data: {
      subscriptions: [
        {...subscription, id: '1'},
        {...subscription, id: '2'},
        {...subscription, id: '3'},
        {...subscription, id: '4'}
      ]
    },
    onPay: action('onPay'),
    onCancel: action('onCancel'),
    onExtend: action('onExtend')
  }
}

export const Empty = {
  args: {
    ...Default.args,
    data: {
      subscriptions: []
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

export const WithoutImage = {
  args: {
    ...Default.args,
    data: {
      subscriptions: [
        {...subscription, id: '1'},
        {...subscription, id: '2', image: null},
        {...subscription, id: '3'},
        {...subscription, id: '4', image: null}
      ]
    }
  }
}
