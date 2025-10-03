import { Meta } from '@storybook/react';
import { mockSubscribeBlock } from '@wepublish/storybook/mocks';
import { SubscribeBlock } from './subscribe-block';

export default {
  component: SubscribeBlock,
  title: 'Blocks/Subscribe',
} as Meta;

export const Default = {
  args: mockSubscribeBlock(),
};
