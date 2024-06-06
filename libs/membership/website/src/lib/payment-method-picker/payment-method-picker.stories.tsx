import {ApolloError} from '@apollo/client'
import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'
import {Meta, StoryObj} from '@storybook/react'
import {
  Exact,
  FullImageFragment,
  FullPaymentMethodFragment,
  PaymentPeriodicity
} from '@wepublish/website/api'
import {useState} from 'react'
import {PaymentMethodPicker} from './payment-method-picker'

export default {
  component: PaymentMethodPicker,
  title: 'Components/PaymentMethodPicker',
  render: function ControlledPaymentMethodPicker(args) {
    const [value, setValue] = useState(args.value)

    return (
      <PaymentMethodPicker
        {...args}
        value={value}
        onChange={paymentMethodId => {
          args.onChange(paymentMethodId)
          setValue(paymentMethodId)
        }}
      />
    )
  }
} as Meta<typeof PaymentMethodPicker>

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

const stripePaymentMethod = {
  __typename: 'PaymentMethod',
  id: '1234',
  description: 'Mit Kreditkarte (Visa, Mastercard)',
  name: 'Stripe',
  slug: 'stripe',
  paymentProviderID: '2',
  image
} as Exact<FullPaymentMethodFragment>

const payrexxPaymentMethod = {
  __typename: 'PaymentMethod',
  id: '12345',
  description: 'Mit TWINT, Paypal, Postfinance, usw.',
  name: 'Payrexx',
  slug: 'payrexx',
  paymentProviderID: '1',
  image
} as Exact<FullPaymentMethodFragment>

export const Default: StoryObj<typeof PaymentMethodPicker> = {
  args: {
    paymentMethods: [stripePaymentMethod, payrexxPaymentMethod],
    onChange: action('onChange')
  }
}

export const Selected = {
  ...Default,
  args: {
    ...Default.args,
    value: PaymentPeriodicity.Quarterly
  }
}

export const Single: StoryObj<typeof PaymentMethodPicker> = {
  ...Default,
  args: {
    ...Default.args,
    paymentMethods: [stripePaymentMethod]
  }
}

export const WithLoading = {
  ...Default,
  args: {
    ...Default.args,
    data: null,
    loading: true
  }
}

export const WithError = {
  ...Default,
  args: {
    ...Default.args,
    data: null,
    error: new ApolloError({
      errorMessage: 'Foobar'
    })
  }
}

export const WithClassName = {
  ...Default,
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  ...Default,
  args: {
    ...Default.args,
    css: css`
      background-color: #eee;
    `
  }
}
