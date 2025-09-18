import { ApolloError } from '@apollo/client';
import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import {
  Exact,
  FullPaymentMethodFragment,
  PaymentPeriodicity,
} from '@wepublish/website/api';
import { useState } from 'react';
import { PaymentMethodPicker } from './payment-method-picker';
import { mockImage } from '@wepublish/storybook/mocks';

export default {
  component: PaymentMethodPicker,
  title: 'Components/PaymentMethodPicker',
  render: function ControlledPaymentMethodPicker(args) {
    const [value, setValue] = useState(args.value);

    return (
      <PaymentMethodPicker
        {...args}
        value={value}
        onChange={paymentMethodId => {
          args.onChange(paymentMethodId);
          setValue(paymentMethodId);
        }}
      />
    );
  },
} as Meta<typeof PaymentMethodPicker>;

const stripePaymentMethod = {
  __typename: 'PaymentMethod',
  id: '1234',
  description: 'Mit Kreditkarte (Visa, Mastercard)',
  name: 'Stripe',
  slug: 'stripe',
  paymentProviderID: '2',
  image: mockImage(),
} as Exact<FullPaymentMethodFragment>;

const payrexxPaymentMethod = {
  __typename: 'PaymentMethod',
  id: '12345',
  description: 'Mit TWINT, Paypal, Postfinance, usw.',
  name: 'Payrexx',
  slug: 'payrexx',
  paymentProviderID: '1',
  image: mockImage(),
} as Exact<FullPaymentMethodFragment>;

export const Default: StoryObj<typeof PaymentMethodPicker> = {
  args: {
    paymentMethods: [stripePaymentMethod, payrexxPaymentMethod],
    onChange: action('onChange'),
  },
};

export const Selected = {
  ...Default,
  args: {
    ...Default.args,
    value: PaymentPeriodicity.Quarterly,
  },
};

export const Single: StoryObj<typeof PaymentMethodPicker> = {
  ...Default,
  args: {
    ...Default.args,
    paymentMethods: [stripePaymentMethod],
  },
};

export const WithLoading = {
  ...Default,
  args: {
    ...Default.args,
    data: null,
    loading: true,
  },
};

export const WithError = {
  ...Default,
  args: {
    ...Default.args,
    data: null,
    error: new ApolloError({
      errorMessage: 'Foobar',
    }),
  },
};
