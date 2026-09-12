import { ComponentConfig } from '@puckeditor/core';
import { withShowErrorAlert } from '@wepublish/errors/website';

import { UserFields } from '../../types';
import { TeaserTitleConfigProps, TeaserTitle } from './teaser-title.component';

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
  render: withShowErrorAlert(TeaserTitle),
};
