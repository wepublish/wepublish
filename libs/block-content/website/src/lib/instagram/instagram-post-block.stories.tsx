import { Meta } from '@storybook/nextjs';
import { InstagramPostBlock } from './instagram-post-block';
import { mockInstagramPostBlock } from '@wepublish/storybook/mocks';

export default {
  component: InstagramPostBlock,
  title: 'Blocks/Instagram',
} as Meta;

export const Default = {
  args: mockInstagramPostBlock(),
};
