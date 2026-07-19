import { Meta } from '@storybook/nextjs-vite';
import { TwitterTweetBlock } from './twitter-tweet-block';
import { mockTwitterTweetBlock } from '@wepublish/storybook/mocks';

export default {
  component: TwitterTweetBlock,
  title: 'Blocks/Twitter',
} as Meta;

export const Default = {
  args: mockTwitterTweetBlock(),
};
