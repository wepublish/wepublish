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

import { websiteFontsSchema } from './website-fonts.schema';
import { websiteFontsView } from './website-fonts.view';
import { settingsHint } from './website-settings-hint';

const hints: ViewFields<typeof websiteFontsSchema> = {
  fonts: {
    helperText: settingsHint(
      'websiteSettings.fonts.description',
      'https://fonts.google.com/'
    ),
  },
};

export const WebsiteFonts = () => {
  const load = useQueryLoader(WebsiteSettingsDocument, {}, data => ({
    fonts: data.websiteSettings.fonts,
  }));
  const [updateWebsiteSettings] = useMutation(UpdateWebsiteSettingsDocument);
  const fonts = useSingletonForm(websiteFontsView, {
    title: 'websiteSettings.fonts.title',
    closePath: '/settings/website',
    fields: hints,
    load,
    save: values =>
      updateWebsiteSettings({ variables: { fonts: values.fonts } }),
  });

  return <FormPage controller={fonts} />;
};
