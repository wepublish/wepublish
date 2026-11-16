import { useParams } from 'react-router-dom';

import { WebsiteAds } from './website-ads';
import { WebsiteAnalytics } from './website-analytics';
import { WebsiteFonts } from './website-fonts';
import { WebsiteTheme } from './website-theme';

export const WebsiteSettingsItem = () => {
  const { category } = useParams();

  switch (category) {
    case 'analytics': {
      return <WebsiteAnalytics />;
    }

    case 'ads': {
      return <WebsiteAds />;
    }

    case 'theme': {
      return <WebsiteTheme />;
    }

    case 'fonts': {
      return <WebsiteFonts />;
    }
  }

  return null;
};
