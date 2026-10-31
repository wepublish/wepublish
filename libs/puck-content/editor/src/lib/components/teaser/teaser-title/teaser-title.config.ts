import { ComponentConfig } from '@puckeditor/core';
import {
  TeaserTitleConfigProps,
  TeaserTitleRender,
} from '@wepublish/puck-content/website';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';

export const TeaserTitleConfig: ComponentConfig<{
  props: TeaserTitleConfigProps;
  fields: UserFields;
}> = {
  label: 'Teaser Title',
  ai: {
    instructions:
      'Renders the title of the teaser provided by the surrounding teaser slot. Only works inside a teaser slot; it has no content of its own.',
  },
  fields: {},
  defaultProps: {},
  render: editorRender(TeaserTitleRender),
};
