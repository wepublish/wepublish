import { type FormValues, formView } from '@wepublish/form/editor';

import {
  type WebsiteAnalyticsProvider,
  websiteAnalyticsSchema,
} from './website-analytics.schema';

type AnalyticsValues = FormValues<typeof websiteAnalyticsSchema>;

const unlessEnabled =
  (provider: WebsiteAnalyticsProvider) => (values: AnalyticsValues) =>
    !values[provider].enabled;

export const websiteAnalyticsView = formView(websiteAnalyticsSchema, {
  sections: [
    {
      title: 'websiteSettings.analytics.google.title',
      fields: [
        'googleAnalytics.enabled',
        'googleAnalytics.key',
        'googleTagManager.enabled',
        'googleTagManager.key',
      ],
    },
    {
      title: 'websiteSettings.analytics.plausible.title',
      fields: ['plausible.enabled', 'plausible.key'],
    },
    {
      title: 'websiteSettings.analytics.piwik.title',
      fields: ['piwik.enabled', 'piwik.key'],
    },
  ],
  fields: {
    'googleAnalytics.key': { hidden: unlessEnabled('googleAnalytics') },
    'googleTagManager.key': { hidden: unlessEnabled('googleTagManager') },
    'plausible.key': { hidden: unlessEnabled('plausible') },
    'piwik.key': { hidden: unlessEnabled('piwik') },
  },
});
