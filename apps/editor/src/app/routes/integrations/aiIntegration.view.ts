import { formView } from '@wepublish/form/editor';

import { aiSettingSchema } from './aiIntegration.schema';
import { integrationPaths } from './integrationPaths';

export const aiSettingView = formView(aiSettingSchema, {
  paths: integrationPaths('ai'),
  sections: [{ fields: ['apiKey', 'systemPrompt'] }],
  fields: {
    systemPrompt: { props: { minRows: 5 } },
  },
});
