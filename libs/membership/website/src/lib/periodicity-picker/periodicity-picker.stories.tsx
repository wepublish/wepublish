import { ApolloError } from '@apollo/client';
import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { PaymentPeriodicity } from '@wepublish/website/api';
import { useState } from 'react';
import { PeriodicityPicker } from './periodicity-picker';

export default {
  component: PeriodicityPicker,
  title: 'Components/PeriodicityPicker',
  render: function ControlledPeriodicityPicker(args) {
    const [value, setValue] = useState(args.value);

    return (
      <PeriodicityPicker
        {...args}
        value={value}
        onChange={periodicity => {
          args.onChange(periodicity);
          setValue(periodicity);
        }}
      />
    );
  },
} as Meta<typeof PeriodicityPicker>;

export const Default: StoryObj<typeof PeriodicityPicker> = {
  args: {
    periodicities: [
      PaymentPeriodicity.Monthly,
      PaymentPeriodicity.Quarterly,
      PaymentPeriodicity.Biannual,
      PaymentPeriodicity.Yearly,
      PaymentPeriodicity.Biennial,
      PaymentPeriodicity.Lifetime,
    ],
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

export const Single: StoryObj<typeof PeriodicityPicker> = {
  ...Default,
  args: {
    ...Default.args,
    periodicities: [PaymentPeriodicity.Monthly],
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
