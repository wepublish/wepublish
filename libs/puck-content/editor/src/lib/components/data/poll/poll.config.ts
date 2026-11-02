import { ComponentConfig } from '@puckeditor/core';
import { BuilderPollBlockProps } from '@wepublish/website/builder';
import { PollRender } from '@wepublish/puck-content/website';
import { MdPoll } from 'react-icons/md';

import { editorRender } from '../../../blocks/editor-render';
import { resolvedFieldAi } from '../../../resolved';
import { UserFields } from '../../../fields';

export const PollConfig: ComponentConfig<{
  props: BuilderPollBlockProps;
  fields: UserFields;
}> = {
  icon: MdPoll,
  category: 'engagement',
  order: 3,
  nameKey: 'puck.blocks.names.Poll',
  ai: {
    instructions:
      'Shows a poll readers can vote on, with the results after voting. The poll data is loaded automatically and cannot be edited here.',
  },
  fields: {
    poll: {
      type: 'resolved',
      visible: false,
      ai: resolvedFieldAi,
    },
  },
  defaultProps: {},

  render: editorRender(PollRender),
};
