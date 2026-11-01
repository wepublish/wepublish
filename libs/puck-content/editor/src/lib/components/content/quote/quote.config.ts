import { ComponentConfig } from '@puckeditor/core';
import { QuoteConfigProps, QuoteRender } from '@wepublish/puck-content/website';

import { editorRender } from '../../../blocks/editor-render';
import {
  withImageDataSource,
  WithDataSource,
} from '../../../blocks/with-datasource';
import { UserFields } from '../../../fields';

export const QuoteConfig: ComponentConfig<{
  props: WithDataSource<QuoteConfigProps>;
  fields: UserFields;
}> = withImageDataSource<QuoteConfigProps>({
  ai: {
    instructions:
      'A highlighted pull quote with an attribution. Use it to emphasise a notable statement or citation. The quote field holds the quoted text and the author field holds the person or source it is attributed to. The image is referenced by the single image datasource. Keep the existing value and never invent one.',
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

  render: editorRender(QuoteRender),
});
