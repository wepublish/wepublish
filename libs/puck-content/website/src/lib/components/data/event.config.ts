import { ComponentConfig } from '@puckeditor/core';
import { EventBlock } from '@wepublish/block-content/website';
import { BuilderEventBlockProps } from '@wepublish/website/builder';

import { resolvedFieldAi } from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';

export const EventConfig: ComponentConfig<{
  props: BuilderEventBlockProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'Shows a list of upcoming events with date, location and a short description. The events are loaded automatically and cannot be edited here.',
  },
  fields: {
    events: {
      type: 'resolved',
      visible: false,
      ai: resolvedFieldAi,
    },
  },
  defaultProps: {
    events: [],
  },

  render: EventBlock,
};
