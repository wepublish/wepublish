import { Meta } from '@storybook/nextjs';
import { RichTextBlock } from './richtext-block';
import { mockRichText } from '@wepublish/storybook/mocks';

export default {
  component: RichTextBlock,
  title: 'Blocks/Richtext',
} as Meta;

export const Default = {
  args: {
    richText: mockRichText(),
  },
};
