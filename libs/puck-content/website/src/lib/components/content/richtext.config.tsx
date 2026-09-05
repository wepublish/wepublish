import { ComponentConfig } from '@puckeditor/core';
import { RichTextBlock } from '@wepublish/block-content/website';
import { mockRichText } from '@wepublish/storybook/mocks';
import { BuilderRichTextBlockProps } from '@wepublish/website/builder';

import { richtextFieldAi } from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';

export const RichTextConfig: ComponentConfig<{
  props: BuilderRichTextBlockProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'The main body copy of an article. Renders formatted rich text supporting paragraphs, headings, lists, links, bold and italic. Use this for the bulk of the written content; prefer it over other blocks whenever you need running prose.',
  },
  fields: {
    richText: {
      type: 'richtext',
      ai: richtextFieldAi,
    },
  },
  defaultProps: {
    richText: mockRichText(),
  },

  render: RichTextBlock,
};
