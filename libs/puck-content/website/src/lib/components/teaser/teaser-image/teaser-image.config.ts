import { ComponentConfig } from '@puckeditor/core';
import { withShowErrorAlert } from '@wepublish/errors/website';

import { UserFields } from '../../../types';
import { TeaserImageConfigProps, TeaserImage } from './teaser-image.component';

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
  render: withShowErrorAlert(TeaserImage),
};
