import { Meta } from '@storybook/nextjs-vite';
import { TeaserGridFlexBlock } from './teaser-grid-flex-block';
import { mockTeaserGridFlexBlock } from '@wepublish/storybook/mocks';

export default {
  component: TeaserGridFlexBlock,
  title: 'Blocks/Teaser Grid Flex',
} as Meta;

export const Default = {
  args: mockTeaserGridFlexBlock(),
};
