import { Meta } from '@storybook/nextjs-vite';
import { TikTokVideoBlock } from './tik-tok-video-block';
import { mockTikTokVideoBlock } from '@wepublish/storybook/mocks';

export default {
  component: TikTokVideoBlock,
  title: 'Blocks/TikTok',
} as Meta;

export const Default = {
  args: mockTikTokVideoBlock(),
};
