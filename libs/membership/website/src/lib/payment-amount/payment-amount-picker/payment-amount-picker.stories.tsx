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

const baseArgs = {
  amountPerMonthMin: 1000,
  amountPerMonthTarget: 1500,
  currency: Currency.Eur,
  value: 1500,
  onChange: action('onChange'),
};

export const PaymentAmountPicker: StoryObj<typeof PaymentAmountPickerCmp> = {
  args: baseArgs,
};

export const WithPresetAmounts: StoryObj<typeof PaymentAmountPickerCmp> = {
  args: {
    ...baseArgs,
    presetAmounts: [500, 2500, 5000],
    value: 2500,
  },
};

export const EmptyPresetAmountsFallback: StoryObj<
  typeof PaymentAmountPickerCmp
> = {
  args: {
    ...baseArgs,
    presetAmounts: [],
  },
};
