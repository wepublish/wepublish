import { Meta } from '@storybook/nextjs-vite';
import { FacebookPostBlock } from './facebook-post-block';
import { mockFacebookPostBlock } from '@wepublish/storybook/mocks';

export default {
  component: FacebookPostBlock,
  title: 'Blocks/Facebook/Post',
} as Meta;

export const Default = {
  args: mockFacebookPostBlock(),
};
