import { ComponentConfig } from '@puckeditor/core';
import { IFrameRender } from '@wepublish/puck-content/website';
import { BuilderIFrameBlockProps } from '@wepublish/website/builder';
import { MdWeb } from 'react-icons/md';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';

export const IFrameConfig: ComponentConfig<{
  props: BuilderIFrameBlockProps;
  fields: UserFields;
}> = {
  icon: MdWeb,
  category: 'embed',
  order: 5,
  nameKey: 'puck.blocks.names.IFrame',
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

  render: editorRender(IFrameRender),
};
