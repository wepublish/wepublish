import { ComponentConfig } from '@puckeditor/core';

import { resolvedFieldAi } from '@wepublish/puck-content/editor';
import { withImageDataSource } from '../../with-datasource';
import { UserFields } from '../../../types';
import { QuoteConfigProps, QuoteRender } from './quote.component';

export const QuoteConfig: ComponentConfig<{
  props: QuoteConfigProps;
  fields: UserFields;
}> = withImageDataSource<QuoteConfigProps>({
  ai: {
    instructions:
      'A highlighted pull quote with an attribution. Use it to emphasise a notable statement or citation. The quote field holds the quoted text and the author field holds the person or source it is attributed to. The image is referenced by the single image datasource — keep the existing value and never invent one.',
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
    image: {
      type: 'resolved',
      visible: false,
      ai: resolvedFieldAi,
    },
  },
  defaultProps: {
    quote: 'Hello, world',
    author: 'Julius Cesar',
  },

  render: QuoteRender,
});
