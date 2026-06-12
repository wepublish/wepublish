import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { AmountSelectionLayout, Currency } from '@wepublish/website/api';
import { useState } from 'react';
import { PaymentAmount } from './payment-amount';

export default {
  component: PaymentAmount,
  title: 'Components/PaymentAmount',
  render: function ControlledPaymentAmount(args) {
    const [value, setValue] = useState(args.value);

    return (
      <PaymentAmount
        {...args}
        value={value}
        onChange={amount => {
          args.onChange(amount);
          setValue(amount);
        }}
      />
    );
  },
} as Meta<typeof PaymentAmount>;

const baseArgs = {
  amountPerMonthMin: 1000,
  amountPerMonthMax: 5000,
  amountPerMonthTarget: 1500,
  currency: Currency.Chf,
  value: 1500,
  donate: false,
  onChange: action('onChange'),
};

export const AsSlider: StoryObj<typeof PaymentAmount> = {
  args: {
    ...baseArgs,
    amountSelectionLayout: AmountSelectionLayout.Slider,
  },
};

export const AsPicker: StoryObj<typeof PaymentAmount> = {
  args: {
    ...baseArgs,
    amountSelectionLayout: AmountSelectionLayout.Picker,
    presetAmounts: [1000, 2000, 3000],
  },
};

export const DefaultsToSlider: StoryObj<typeof PaymentAmount> = {
  args: {
    ...baseArgs,
    amountSelectionLayout: undefined,
  },
};
