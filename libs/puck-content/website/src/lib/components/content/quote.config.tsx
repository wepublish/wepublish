import { ComponentConfig } from '@puckeditor/core';
import { QuoteBlock } from '@wepublish/block-content/website';
import { BuilderQuoteBlockProps } from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const QuoteConfig: ComponentConfig<{
  props: BuilderQuoteBlockProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'A highlighted pull quote with an attribution. Use it to emphasise a notable statement or citation. The quote field holds the quoted text and the author field holds the person or source it is attributed to.',
  },
  fields: {
    quote: {
      type: 'text',
      contentEditable: true,
    },
    author: {
      type: 'text',
      contentEditable: true,
    },
  },
  defaultProps: {
    quote: 'Hello, world',
    author: 'Julius Cesar',
  },

  render: QuoteBlock,
};
