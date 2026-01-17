import { ComponentConfig } from '@puckeditor/core';
import { HtmlBlock } from '@wepublish/block-content/website';
import { BuilderHTMLBlockProps } from '@wepublish/website/builder';

export const HtmlConfig: ComponentConfig<BuilderHTMLBlockProps> = {
  fields: {
    html: {
      type: 'text',
    },
  },
  defaultProps: {
    html: '',
  },
  inline: true,
  render: HtmlBlock,
};
