import { Meta } from '@storybook/nextjs-vite';
import { mockBlockTemplateBlock } from '@wepublish/storybook/mocks';
import { BlockTemplateBlock } from './block-template-block';

export default {
  component: BlockTemplateBlock,
  title: 'Blocks/Block Template',
} as Meta;

export const Default = {
  args: mockBlockTemplateBlock(),
};

export const WithoutTemplate = {
  args: {
    ...mockBlockTemplateBlock(),
    template: null,
  },
};
