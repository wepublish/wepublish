import { useParams } from 'react-router-dom';

import { WebsiteAds } from './website-ads';
import { WebsiteAnalytics } from './website-analytics';
import { WebsiteMail } from './website-mail';
import { WebsiteTheme } from './website-theme';

export const WebsiteSettingsItem = () => {
  const { category } = useParams();

  switch (category) {
    case 'analytics': {
      return <WebsiteAnalytics />;
    }

    case 'mail': {
      return <WebsiteMail />;
    }

    case 'ads': {
      return <WebsiteAds />;
    }

    case 'theme': {
      return <WebsiteTheme />;
    }
  }

  return null;
};
