import { ComponentConfig } from '@puckeditor/core';
import { BuilderPollBlockProps } from '@wepublish/website/builder';

import { resolvedFieldAi } from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';
import { PollRender } from './poll.component';

export const PollConfig: ComponentConfig<{
  props: BuilderPollBlockProps;
  fields: UserFields;
}> = {
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

  render: PollRender,
};
