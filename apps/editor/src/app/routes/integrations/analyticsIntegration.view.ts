import { formView } from '@wepublish/form/editor';

import { analyticsSettingSchema } from './analyticsIntegration.schema';
import { integrationPaths } from './integrationPaths';

export const analyticsSettingView = formView(analyticsSettingSchema, {
  paths: integrationPaths('analytics'),
  sections: [{ fields: ['articlePrefix', 'property', 'credentials'] }],
  fields: {
    articlePrefix: { props: { autoComplete: 'one-time-code' } },
    property: { props: { autoComplete: 'one-time-code' } },
  },
});
