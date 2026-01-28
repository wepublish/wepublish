import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { Currency } from '@wepublish/website/api';
import { useState } from 'react';
import { PaymentAmountPicker as PaymentAmountPickerCmp } from './payment-amount-picker';

export default {
  component: PaymentAmountPickerCmp,
  title: 'Components/PaymentAmountPicker',
  render: function ControlledPaymentAmountPicker(args) {
    const [value, setValue] = useState(args.value);

    return (
      <PaymentAmountPickerCmp
        {...args}
        value={value}
        onChange={amount => {
          args.onChange(amount);
          setValue(amount);
        }}
      />
    );
  },
} as Meta<typeof PaymentAmountPickerCmp>;

export const PaymentAmountPicker: StoryObj<typeof PaymentAmountPickerCmp> = {
  args: {
    amountPerMonthMin: 1000,
    amountPerMonthTarget: 1500,
    currency: Currency.Eur,
    value: 1500,
    onChange: action('onChange'),
  },
};
