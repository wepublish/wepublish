import { ComponentConfig } from '@puckeditor/core';
import {
  TeaserDateConfigProps,
  TeaserDateRender,
} from '@wepublish/puck-content/website';
import { MdCalendarToday } from 'react-icons/md';

import { switchFieldAi } from '../../../switch/switch.field';
import { UserFields } from '../../../fields';
import {
  hideWhenEmptyField,
  hideWhenEmptyInstructions,
  teaserPartRender,
} from '../teaser-part/teaser-part';

export const TeaserDateConfig: ComponentConfig<{
  props: TeaserDateConfigProps;
  fields: UserFields;
}> = {
  label: 'Teaser Date',
  icon: MdCalendarToday,
  category: 'teaser',
  group: 'teaserParts',
  order: 6,
  nameKey: 'puck.blocks.names.TeaserDate',
  ai: {
    instructions:
      'Renders the publish date of the teaser provided by the surrounding teaser slot. Only works inside a teaser slot; it has no content of its own. showTime additionally shows the time of day.' +
      hideWhenEmptyInstructions('publish date'),
  },
  fields: {
    hideWhenEmpty: hideWhenEmptyField,
    showTime: {
      type: 'switch',
      label: 'Show time',
      ai: switchFieldAi('Whether the time of day is shown next to the date.'),
    },
  },
  defaultProps: {
    hideWhenEmpty: true,
    showTime: false,
  },
  render: teaserPartRender('TeaserDate', TeaserDateRender),
};
