import { useParams } from 'react-router-dom';

import { WebsiteAnalytics } from './website-analytics';
import { WebsiteTheme } from './website-theme';

export const WebsiteSettingsItem = () => {
  const { category } = useParams();

  switch (category) {
    case 'analytics': {
      return <WebsiteAnalytics />;
    }

    case 'theme': {
      return <WebsiteTheme />;
    }
  }

  return null;
};
