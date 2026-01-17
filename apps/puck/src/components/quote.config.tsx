import { ComponentConfig } from '@puckeditor/core';
import { BuilderQuoteBlockProps } from '@wepublish/website/builder';
import { QuoteBlock } from '@wepublish/block-content/website';

export const QuoteConfig: ComponentConfig<BuilderQuoteBlockProps> = {
  fields: {
    quote: {
      type: 'text',
    },
    author: {
      type: 'text',
    },
  },
  defaultProps: {
    quote: 'Hello, world',
    author: 'Julius Cesar',
  },
  inline: true,
  render: QuoteBlock,
};
