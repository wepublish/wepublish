import { ComponentConfig } from '@puckeditor/core';
import {
  TeaserPreTitleConfigProps,
  TeaserPreTitleRender,
} from '@wepublish/puck-content/website';
import { MdShortText } from 'react-icons/md';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';

export const TeaserPreTitleConfig: ComponentConfig<{
  props: TeaserPreTitleConfigProps;
  fields: UserFields;
}> = {
  label: 'Teaser Pre-Title',
  icon: MdShortText,
  category: 'teaser',
  group: 'teaserParts',
  order: 2,
  nameKey: 'puck.blocks.names.TeaserPreTitle',
  ai: {
    instructions:
      'Renders the pre-title (eyebrow/kicker) of the teaser provided by the surrounding teaser slot. Only works inside a teaser slot; it has no content of its own.',
  },
  fields: {},
  defaultProps: {},
  render: editorRender(TeaserPreTitleRender),
};
