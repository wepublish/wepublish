import { ComponentConfig } from '@puckeditor/core';
import { RichTextBlock } from '@wepublish/block-content/website';
import { BuilderRichTextBlockProps } from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const RichTextConfig: ComponentConfig<{
  props: BuilderRichTextBlockProps;
  fields: UserFields;
}> = {
  fields: {
    richText: {
      type: 'text',
    },
  },
  defaultProps: {
    richText: [],
  },

  render: RichTextBlock,
};
