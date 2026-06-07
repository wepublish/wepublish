import { ComponentConfig } from '@puckeditor/core';
import { QuoteBlock } from '@wepublish/block-content/website';
import { BuilderQuoteBlockProps } from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const QuoteConfig: ComponentConfig<{
  props: BuilderQuoteBlockProps;
  fields: UserFields;
}> = {
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
