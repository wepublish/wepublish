import { Meta } from '@storybook/nextjs-vite';
import { StreamableVideoBlock } from './streamable-video-block';
import { mockStreamableVideoBlock } from '@wepublish/storybook/mocks';

export default {
  component: StreamableVideoBlock,
  title: 'Blocks/Streamable',
} as Meta;

export const Default = {
  args: mockStreamableVideoBlock(),
};
