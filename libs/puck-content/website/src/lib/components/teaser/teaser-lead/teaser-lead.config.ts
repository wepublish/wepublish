import { ComponentConfig } from '@puckeditor/core';
import { withShowErrorAlert } from '@wepublish/errors/website';

import { UserFields } from '../../../types';
import { TeaserLeadConfigProps, TeaserLead } from './teaser-lead.component';

export const TeaserLeadConfig: ComponentConfig<{
  props: TeaserLeadConfigProps;
  fields: UserFields;
}> = {
  label: 'Teaser Lead',
  ai: {
    instructions:
      'Renders the lead text of the teaser provided by the surrounding teaser slot. Only works inside a teaser slot; it has no content of its own.',
  },
  fields: {},
  defaultProps: {},
  render: withShowErrorAlert(TeaserLead),
};
