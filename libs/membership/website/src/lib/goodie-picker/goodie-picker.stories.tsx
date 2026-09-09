import { action } from 'storybook/actions';
import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { mockGoodie } from '@wepublish/storybook/mocks';
import { useState } from 'react';
import { GoodiePicker } from './goodie-picker';

export default {
  component: GoodiePicker,
  title: 'Components/GoodiePicker',
  render: function ControlledGoodiePicker(args) {
    const [value, setValue] = useState(args.value);

    return (
      <GoodiePicker
        {...args}
        value={value}
        onChange={goodieId => {
          args.onChange(goodieId);
          setValue(goodieId);
        }}
      />
    );
  },
} as Meta<typeof GoodiePicker>;

const goodie = mockGoodie();

export const Default: StoryObj<typeof GoodiePicker> = {
  args: {
    goodies: [
      goodie,
      { ...goodie, id: '2' },
      { ...goodie, id: '3', image: null },
    ],
    onChange: action('onChange'),
  },
};

export const Selected = {
  ...Default,
  args: {
    ...Default.args,
    value: goodie.id,
  },
};

export const Single: StoryObj<typeof GoodiePicker> = {
  ...Default,
  args: {
    ...Default.args,
    goodies: [goodie],
  },
};

export const OutOfStock: StoryObj<typeof GoodiePicker> = {
  ...Default,
  args: {
    ...Default.args,
    goodies: [goodie, { ...goodie, id: '2', stock: 0 }],
  },
};

export const Disabled = {
  ...Default,
  args: {
    ...Default.args,
    disabled: true,
  },
};
