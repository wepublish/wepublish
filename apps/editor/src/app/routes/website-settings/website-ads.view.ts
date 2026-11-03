import { type FormValues, formView } from '@wepublish/form/editor';

import { websiteAdsSchema } from './website-ads.schema';

type AdsValues = FormValues<typeof websiteAdsSchema>;

const sparkLoopDisabled = ({ sparkLoop }: AdsValues) => !sparkLoop.enabled;

export const websiteAdsView = formView(websiteAdsSchema, {
  sections: [
    {
      title: 'websiteSettings.ads.sparkLoop.title',
      fields: ['sparkLoop.enabled', 'sparkLoop.key'],
    },
  ],
  fields: {
    'sparkLoop.key': { hidden: sparkLoopDisabled },
  },
});
