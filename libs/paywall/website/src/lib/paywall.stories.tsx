import { Meta, StoryObj } from '@storybook/react';
import { Paywall } from './paywall';

export default {
  component: Paywall,
  title: 'Components/Paywall',
} satisfies Meta;

export const Default = {
  args: {},
} satisfies StoryObj<typeof Paywall>;
