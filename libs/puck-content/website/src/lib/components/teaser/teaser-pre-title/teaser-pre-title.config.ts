import { ComponentConfig } from '@puckeditor/core';
import { withShowErrorAlert } from '@wepublish/errors/website';

import { UserFields } from '../../../types';
import {
  TeaserPreTitleConfigProps,
  TeaserPreTitle,
} from './teaser-pre-title.component';

export const TeaserPreTitleConfig: ComponentConfig<{
  props: TeaserPreTitleConfigProps;
  fields: UserFields;
}> = {
  label: 'Teaser Pre-Title',
  ai: {
    instructions:
      'Renders the pre-title (eyebrow/kicker) of the teaser provided by the surrounding teaser slot. Only works inside a teaser slot; it has no content of its own.',
  },
  fields: {},
  defaultProps: {},
  render: withShowErrorAlert(TeaserPreTitle),
};
