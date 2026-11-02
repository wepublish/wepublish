import { ComponentConfig } from '@puckeditor/core';
import {
  TeaserAuthorsConfigProps,
  TeaserAuthorsRender,
} from '@wepublish/puck-content/website';
import { MdPeople } from 'react-icons/md';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';

export const TeaserAuthorsConfig: ComponentConfig<{
  props: TeaserAuthorsConfigProps;
  fields: UserFields;
}> = {
  label: 'Teaser Authors',
  icon: MdPeople,
  category: 'teaser',
  group: 'teaserParts',
  order: 5,
  nameKey: 'puck.blocks.names.TeaserAuthors',
  ai: {
    instructions:
      'Renders the author names of the teaser provided by the surrounding teaser slot. Only works inside a teaser slot; it has no content of its own.',
  },
  fields: {},
  defaultProps: {},
  render: editorRender(TeaserAuthorsRender),
};
