import { Meta } from '@storybook/react';
import { FacebookVideoBlock } from './facebook-video-block';
import { mockFacebookVideoBlock } from '@wepublish/storybook/mocks';

export default {
  component: FacebookVideoBlock,
  title: 'Blocks/Facebook/Video',
} as Meta;

export const Default = {
  args: mockFacebookVideoBlock(),
  parameters: {
    chromatic: { disableSnapshot: true }, // loads live Facebook embed — snapshot would always differ
  },
};
