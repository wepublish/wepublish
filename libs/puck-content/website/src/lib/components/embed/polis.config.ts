import { ComponentConfig } from '@puckeditor/core';
import { PolisConversationBlock } from '@wepublish/block-content/website';
import { BuilderPolisConversationBlockProps } from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const PolisConfig: ComponentConfig<{
  props: BuilderPolisConversationBlockProps;
  fields: UserFields;
}> = {
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

  render: PolisConversationBlock,
};
