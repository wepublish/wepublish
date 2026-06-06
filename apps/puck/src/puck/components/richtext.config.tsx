import { ComponentConfig } from '@puckeditor/core';
import { RichTextBlock } from '@wepublish/block-content/website';
import { BuilderRichTextBlockProps } from '@wepublish/website/builder';

export const RichTextConfig: ComponentConfig<BuilderRichTextBlockProps> = {
  fields: {
    richText: {
      type: 'richtext',
      contentEditable: false,
    },
  },
  defaultProps: {
    richText: [],
  },

  render: RichTextBlock,
};
