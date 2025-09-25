import { Meta } from '@storybook/react';
import { BreakBlock } from '../break/break-block';
import { mockBreakBlock } from '@wepublish/storybook/mocks';

export default {
  component: BreakBlock,
  title: 'Blocks/Break',
} as Meta;

export const Default = {
  args: mockBreakBlock(),
};

export const WithButton = {
  args: mockBreakBlock({ hideButton: false }),
};

export const WithoutImage = {
  args: mockBreakBlock({ image: null }),
};
