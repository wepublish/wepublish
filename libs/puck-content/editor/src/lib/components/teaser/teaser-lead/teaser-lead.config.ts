import { ComponentConfig } from '@puckeditor/core';
import {
  TeaserLeadConfigProps,
  TeaserLeadRender,
} from '@wepublish/puck-content/website';
import { MdSubject } from 'react-icons/md';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';

export const TeaserLeadConfig: ComponentConfig<{
  props: TeaserLeadConfigProps;
  fields: UserFields;
}> = {
  label: 'Teaser Lead',
  icon: MdSubject,
  category: 'teaser',
  group: 'teaserParts',
  order: 4,
  nameKey: 'puck.blocks.names.TeaserLead',
  ai: {
    instructions:
      'Renders the lead text of the teaser provided by the surrounding teaser slot. Only works inside a teaser slot; it has no content of its own.',
  },
  fields: {},
  defaultProps: {},
  render: editorRender(TeaserLeadRender),
};
