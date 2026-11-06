import { useMutation } from '@apollo/client/react';
import { Link } from '@mui/material';
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
import { Trans } from 'react-i18next';

import { websiteAnalyticsSchema } from './website-analytics.schema';
import { websiteAnalyticsView } from './website-analytics.view';

const hint = (i18nKey: string, href?: string) => (
  <Trans
    i18nKey={i18nKey}
    components={
      href === undefined ? undefined : (
        {
          url: (
            <Link
              href={href}
              target="_blank"
              rel="noreferrer"
            />
          ),
        }
      )
    }
  />
);

const hints: ViewFields<typeof websiteAnalyticsSchema> = {
  'googleAnalytics.enabled': {
    helperText: hint(
      'websiteSettings.analytics.google.ga',
      'https://developers.google.com/analytics'
    ),
  },
  'googleAnalytics.key': {
    helperText: hint(
      'websiteSettings.analytics.google.gaLocator',
      'https://support.google.com/analytics/answer/9539598'
    ),
  },
  'googleTagManager.enabled': {
    helperText: hint(
      'websiteSettings.analytics.google.gtm',
      'https://marketingplatform.google.com/about/tag-manager/'
    ),
  },
  'googleTagManager.key': {
    helperText: hint(
      'websiteSettings.analytics.google.gtmLocator',
      'https://support.google.com/tagmanager/answer/15107467'
    ),
  },
  'plausible.enabled': {
    helperText: hint(
      'websiteSettings.analytics.plausible.pa',
      'https://plausible.io'
    ),
  },
  'plausible.key': {
    helperText: hint(
      'websiteSettings.analytics.plausible.paLocator',
      'https://plausible.io/docs/website-settings'
    ),
  },
  'piwik.enabled': {
    helperText: hint(
      'websiteSettings.analytics.piwik.pro',
      'https://piwik.pro'
    ),
  },
  'piwik.key': {
    helperText: hint('websiteSettings.analytics.piwik.proLocator'),
  },
};

export const WebsiteAnalytics = () => {
  const load = useQueryLoader(
    WebsiteSettingsDocument,
    {},
    data => data.websiteSettings.analytics
  );
  const [updateWebsiteSettings] = useMutation(UpdateWebsiteSettingsDocument);
  const analytics = useSingletonForm(websiteAnalyticsView, {
    title: 'websiteSettings.analytics.title',
    closePath: '/settings/website',
    fields: hints,
    load,
    save: values => updateWebsiteSettings({ variables: { analytics: values } }),
  });

  return <FormPage controller={analytics} />;
};
