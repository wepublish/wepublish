import { ComponentConfig } from '@puckeditor/core';
import { BuilderRichTextBlockProps } from '@wepublish/website/builder';
import { RichTextBlock } from '@wepublish/block-content/website';
import { mockRichText } from '@wepublish/storybook/mocks';

export const RichTextConfig: ComponentConfig<BuilderRichTextBlockProps> = {
  fields: {
    richText: {
      type: 'richtext',
      contentEditable: false,
    },
  },
  defaultProps: {
    richText: mockRichText(),
  },
  inline: true,
  render: RichTextBlock,
};
