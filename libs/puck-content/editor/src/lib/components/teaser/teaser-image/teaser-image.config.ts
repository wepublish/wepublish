import { ComponentConfig } from '@puckeditor/core';
import {
  TeaserImageConfigProps,
  TeaserImageRender,
} from '@wepublish/puck-content/website';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';

export const TeaserImageConfig: ComponentConfig<{
  props: TeaserImageConfigProps;
  fields: UserFields;
}> = {
  label: 'Teaser Image',
  ai: {
    instructions:
      'Renders the image of the teaser provided by the surrounding teaser slot. Only works inside a teaser slot; it has no content of its own.',
  },
  fields: {},
  defaultProps: {},
  render: editorRender(TeaserImageRender),
};
