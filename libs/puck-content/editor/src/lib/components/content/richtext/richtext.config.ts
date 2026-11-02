import { ComponentConfig } from '@puckeditor/core';
import { RichTextRender } from '@wepublish/puck-content/website';
import { BuilderRichTextBlockProps } from '@wepublish/website/builder';
import { MdNotes } from 'react-icons/md';

import { editorRender } from '../../../blocks/editor-render';
import { richtextFieldAi } from '../../../richtext/richtext.field';
import { placeholderRichText } from '../../placeholder-richtext';
import { UserFields } from '../../../fields';

export const RichTextConfig: ComponentConfig<{
  props: BuilderRichTextBlockProps;
  fields: UserFields;
}> = {
  icon: MdNotes,
  category: 'text',
  order: 2,
  nameKey: 'puck.blocks.names.RichText',
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
    richText: placeholderRichText(),
  },

  render: editorRender(RichTextRender),
};
