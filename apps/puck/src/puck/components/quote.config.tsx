import { ComponentConfig } from '@puckeditor/core';
import { QuoteBlock } from '@wepublish/block-content/website';
import { BuilderQuoteBlockProps } from '@wepublish/website/builder';

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

  render: QuoteBlock,
};
