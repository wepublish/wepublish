import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { Currency } from '@wepublish/website/api';
import { useState } from 'react';
import { PaymentAmountSlider } from './payment-amount-slider';

export default {
  component: PaymentAmountSlider,
  title: 'Components/PaymentAmountSlider',
  render: function ControlledPaymentAmountSlider(args) {
    const [value, setValue] = useState(args.value);

    return (
      <PaymentAmountSlider
        {...args}
        value={value}
        onChange={amount => {
          args.onChange(amount);
          setValue(amount);
        }}
      />
    );
  },
} as Meta<typeof PaymentAmountSlider>;

export const Default: StoryObj<typeof PaymentAmountSlider> = {
  args: {
    amountPerMonthMin: 1000,
    amountPerMonthTarget: 1500,
    currency: Currency.Eur,
    value: 1500,
    onChange: action('onChange'),
  },
};

export const Donate: StoryObj<typeof PaymentAmountSlider> = {
  ...Default,
  args: {
    ...Default.args,
    donate: true,
  },
};
