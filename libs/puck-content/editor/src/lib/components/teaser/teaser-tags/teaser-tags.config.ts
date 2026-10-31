import { ComponentConfig } from '@puckeditor/core';
import {
  TeaserTagsConfigProps,
  TeaserTagsRender,
} from '@wepublish/puck-content/website';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';

export const TeaserTagsConfig: ComponentConfig<{
  props: TeaserTagsConfigProps;
  fields: UserFields;
}> = {
  label: 'Teaser Tags',
  ai: {
    instructions:
      'Renders the main tags of the teaser provided by the surrounding teaser slot as chips. Only works inside a teaser slot; it has no content of its own. max limits how many tags are shown.',
  },
  fields: {
    max: {
      type: 'number',
      label: 'Max tags',
      min: 1,
    },
  },
  defaultProps: {
    max: 5,
  },
  render: editorRender(TeaserTagsRender),
};
