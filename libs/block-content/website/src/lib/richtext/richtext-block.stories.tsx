import { Meta } from '@storybook/react';
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
