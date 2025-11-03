import { Meta } from '@storybook/react';
import { mockChallenge, mockSubscribeBlock } from '@wepublish/storybook/mocks';
import { SubscribeBlock } from './subscribe-block';
import { WithSubscribeBlockDecorators } from '@wepublish/storybook';

export default {
  component: SubscribeBlock,
  title: 'Blocks/Subscribe',
  decorators: [
    WithSubscribeBlockDecorators({
      challenge: {
        data: {
          challenge: mockChallenge(),
        },
        loading: false,
      },
    }),
  ],
} as Meta;

const subscribeBlock = mockSubscribeBlock();

export const Default = {
  args: subscribeBlock,
};
