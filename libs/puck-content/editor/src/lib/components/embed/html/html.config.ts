import { ComponentConfig } from '@puckeditor/core';
import { HtmlRender } from '@wepublish/puck-content/website';
import { BuilderHTMLBlockProps } from '@wepublish/website/builder';
import { MdCode } from 'react-icons/md';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';

export const HtmlConfig: ComponentConfig<{
  props: BuilderHTMLBlockProps;
  fields: UserFields;
}> = {
  icon: MdCode,
  category: 'embed',
  order: 6,
  nameKey: 'puck.blocks.names.Html',
  ai: {
    instructions:
      'Embeds raw, custom HTML markup directly into the page. Use it only when a reader wants to insert arbitrary HTML or a third-party embed snippet that no dedicated block covers. Prefer the specific embed blocks (YouTube, Vimeo, Facebook, Instagram, TikTok, IFrame) whenever one applies.',
  },
  fields: {
    html: {
      type: 'text',
    },
  },
  defaultProps: {
    html: '',
  },

  render: editorRender(HtmlRender),
};
