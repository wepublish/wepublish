import { ComponentConfig } from '@puckeditor/core';
import { withShowErrorAlert } from '@wepublish/errors/website';

import { UserFields } from '../../../types';
import {
  TeaserAuthorsConfigProps,
  TeaserAuthors,
} from './teaser-authors.component';

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
  render: withShowErrorAlert(TeaserAuthors),
};
