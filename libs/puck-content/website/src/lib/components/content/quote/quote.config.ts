import { ComponentConfig } from '@puckeditor/core';

import { imageFieldAi, resolvedFieldAi } from '@wepublish/puck-content/editor';
import { UserFields } from '../../../types';
import { QuoteConfigProps, QuoteRender } from './quote.component';

export const QuoteConfig: ComponentConfig<{
  props: QuoteConfigProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'A highlighted pull quote with an attribution. Use it to emphasise a notable statement or citation. The quote field holds the quoted text and the author field holds the person or source it is attributed to. imageId references an already uploaded image — keep the existing value and never invent one.',
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
    imageId: {
      type: 'image',
      ai: imageFieldAi,
    },
    image: {
      type: 'resolved',
      ai: resolvedFieldAi,
    },
  },
  defaultProps: {
    quote: 'Hello, world',
    author: 'Julius Cesar',
  },

  render: QuoteRender,
};
