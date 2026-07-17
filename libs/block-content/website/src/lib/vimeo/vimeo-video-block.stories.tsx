import { Meta } from '@storybook/nextjs';
import { VimeoVideoBlock } from './vimeo-video-block';
import { mockVimeoVideoBlock } from '@wepublish/storybook/mocks';

export default {
  component: VimeoVideoBlock,
  title: 'Blocks/Vimeo',
} as Meta;

export const Default = {
  args: mockVimeoVideoBlock(),
};
