import { useMutation } from '@apollo/client/react';
import {
  UpdateWebsiteSettingsDocument,
  WebsiteSettingsDocument,
} from '@wepublish/editor/api';
import {
  type ViewFields,
  FormPage,
  useQueryLoader,
  useSingletonForm,
} from '@wepublish/form/editor';

import { websiteAdsSchema } from './website-ads.schema';
import { websiteAdsView } from './website-ads.view';
import { settingsHint } from './website-settings-hint';

const hints: ViewFields<typeof websiteAdsSchema> = {
  'sparkLoop.enabled': {
    helperText: settingsHint(
      'websiteSettings.ads.sparkLoop.sparkLoop',
      'https://sparkloop.app'
    ),
  },
  'sparkLoop.key': {
    helperText: settingsHint(
      'websiteSettings.ads.sparkLoop.idLocator',
      'https://dash.sparkloop.app/settings/script'
    ),
  },
};

export const WebsiteAds = () => {
  const load = useQueryLoader(
    WebsiteSettingsDocument,
    {},
    data => data.websiteSettings.ads
  );
  const [updateWebsiteSettings] = useMutation(UpdateWebsiteSettingsDocument);
  const ads = useSingletonForm(websiteAdsView, {
    title: 'websiteSettings.ads.title',
    closePath: '/settings/website',
    fields: hints,
    load,
    save: values => updateWebsiteSettings({ variables: { ads: values } }),
  });

  return <FormPage controller={ads} />;
};
