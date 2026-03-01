import { Meta } from '@storybook/react';
import { TwitterTweetBlock } from './twitter-tweet-block';
import { mockTwitterTweetBlock } from '@wepublish/storybook/mocks';

export default {
  component: TwitterTweetBlock,
  title: 'Blocks/Twitter',
} as Meta;

export const Default = {
  args: mockTwitterTweetBlock(),
  parameters: {
    chromatic: { disableSnapshot: true }, // loads live Twitter/X embed — snapshot would always differ
  },
};
