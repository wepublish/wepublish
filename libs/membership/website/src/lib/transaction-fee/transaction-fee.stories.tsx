import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TransactionFee } from './transaction-fee';

export default {
  component: TransactionFee,
  title: 'Components/TransactionFee',
  render: function ControlledTransactionFee(args) {
    const [value, setValue] = useState(args.value);

    return (
      <TransactionFee
        {...args}
        value={value}
        onChange={periodicity => {
          args.onChange(periodicity);
          setValue(periodicity);
        }}
      />
    );
  },
} as Meta<typeof TransactionFee>;

export const Default: StoryObj<typeof TransactionFee> = {
  args: {
    onChange: action('onChange'),
  },
};

export const WithCustomText: StoryObj<typeof TransactionFee> = {
  ...Default,
  args: {
    ...Default.args,
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  },
};
