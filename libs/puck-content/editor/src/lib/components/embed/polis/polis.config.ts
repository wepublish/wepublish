import { ComponentConfig } from '@puckeditor/core';
import { PolisRender } from '@wepublish/puck-content/website';
import { BuilderPolisConversationBlockProps } from '@wepublish/website/builder';
import { MdQuestionAnswer } from 'react-icons/md';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';

export const PolisConfig: ComponentConfig<{
  props: BuilderPolisConversationBlockProps;
  fields: UserFields;
}> = {
  icon: MdQuestionAnswer,
  category: 'embed',
  order: 4,
  nameKey: 'puck.blocks.names.Polis',
  ai: {
    instructions:
      'Embeds a Polis conversation where readers vote on statements. Set conversationID to the identifier from the Polis conversation URL "pol.is/conversationID".',
  },
  fields: {
    conversationID: {
      type: 'text',
      label: 'Conversation ID',
    },
  },
  defaultProps: {},

  render: editorRender(PolisRender),
};
