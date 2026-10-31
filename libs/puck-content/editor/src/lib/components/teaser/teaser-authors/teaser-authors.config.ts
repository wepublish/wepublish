import { ComponentConfig } from '@puckeditor/core';
import {
  TeaserAuthorsConfigProps,
  TeaserAuthorsRender,
} from '@wepublish/puck-content/website';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';

export const TeaserAuthorsConfig: ComponentConfig<{
  props: TeaserAuthorsConfigProps;
  fields: UserFields;
}> = {
  label: 'Teaser Authors',
  ai: {
    instructions:
      'Renders the author names of the teaser provided by the surrounding teaser slot. Only works inside a teaser slot; it has no content of its own.',
  },
  fields: {},
  defaultProps: {},
  render: editorRender(TeaserAuthorsRender),
};
