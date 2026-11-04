import { formView } from '@wepublish/form/editor';

import { challengeSettingSchema } from './challengeIntegration.schema';
import { integrationPaths } from './integrationPaths';

export const challengeSettingView = formView(challengeSettingSchema, {
  paths: integrationPaths('challenge'),
  sections: [{ fields: ['type', 'name', 'siteKey', 'secret'] }],
  fields: {
    siteKey: { props: { autoComplete: 'one-time-code' } },
  },
});
