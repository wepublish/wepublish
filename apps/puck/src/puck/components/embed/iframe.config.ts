import { ComponentConfig } from '@puckeditor/core';
import { IFrameBlock } from '@wepublish/block-content/website';
import { BuilderIFrameBlockProps } from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const IFrameConfig: ComponentConfig<{
  props: BuilderIFrameBlockProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'Embeds an external web page inside a sandboxed iframe. Set url to the full URL of the page to embed and title to a short accessible description of its content. Use it for interactive embeds or pages that have no dedicated block.',
  },
  fields: {
    url: {
      type: 'text',
    },
    title: {
      type: 'text',
    },
  },
  defaultProps: {
    sandbox: 'sandbox',
  },

  render: IFrameBlock,
};
