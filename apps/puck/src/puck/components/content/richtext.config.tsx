import { ComponentConfig } from '@puckeditor/core';
import { RichTextBlock } from '@wepublish/block-content/website';
import { mockRichText } from '@wepublish/storybook/mocks';
import { BuilderRichTextBlockProps } from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const RichTextConfig: ComponentConfig<{
  props: BuilderRichTextBlockProps;
  fields: UserFields;
}> = {
  fields: {
    richText: {
      type: 'richtext',
    },
  },
  defaultProps: {
    richText: mockRichText(),
  },

  render: RichTextBlock,
};
