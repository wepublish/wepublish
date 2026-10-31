import { ComponentConfig } from '@puckeditor/core';
import {
  TeaserDateConfigProps,
  TeaserDateRender,
} from '@wepublish/puck-content/website';

import { editorRender } from '../../../blocks/editor-render';
import { switchFieldAi } from '../../../switch/switch.field';
import { UserFields } from '../../../fields';

export const TeaserDateConfig: ComponentConfig<{
  props: TeaserDateConfigProps;
  fields: UserFields;
}> = {
  label: 'Teaser Date',
  ai: {
    instructions:
      'Renders the publish date of the teaser provided by the surrounding teaser slot. Only works inside a teaser slot; it has no content of its own. showTime additionally shows the time of day.',
  },
  fields: {
    showTime: {
      type: 'switch',
      label: 'Show time',
      ai: switchFieldAi('Whether the time of day is shown next to the date.'),
    },
  },
  defaultProps: {
    showTime: false,
  },
  render: editorRender(TeaserDateRender),
};
