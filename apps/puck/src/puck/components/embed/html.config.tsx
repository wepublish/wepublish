import { ComponentConfig } from '@puckeditor/core';
import { HtmlBlock } from '@wepublish/block-content/website';
import { BuilderHTMLBlockProps } from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const HtmlConfig: ComponentConfig<{
  props: BuilderHTMLBlockProps;
  fields: UserFields;
}> = {
  fields: {
    html: {
      type: 'text',
    },
  },
  defaultProps: {
    html: '',
  },

  render: HtmlBlock,
};
