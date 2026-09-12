import { ComponentConfig } from '@puckeditor/core';
import { withShowErrorAlert } from '@wepublish/errors/website';

import { switchFieldAi } from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';
import { TeaserDateConfigProps, TeaserDate } from './teaser-date.component';

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
  render: withShowErrorAlert(TeaserDate),
};
