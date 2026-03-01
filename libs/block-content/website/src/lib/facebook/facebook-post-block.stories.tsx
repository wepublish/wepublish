import { Meta } from '@storybook/react';
import { FacebookPostBlock } from './facebook-post-block';
import { mockFacebookPostBlock } from '@wepublish/storybook/mocks';

export default {
  component: FacebookPostBlock,
  title: 'Blocks/Facebook/Post',
} as Meta;

export const Default = {
  args: mockFacebookPostBlock(),
  parameters: {
    chromatic: { disableSnapshot: true }, // loads live Facebook embed — snapshot would always differ
  },
};
