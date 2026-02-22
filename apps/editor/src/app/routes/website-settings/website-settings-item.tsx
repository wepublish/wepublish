import { useParams } from 'react-router-dom';

import { WebsiteAnalytics } from './website-analytics';

export const WebsiteSettingsItem = () => {
  const { category } = useParams();

  switch (category) {
    case 'analytics': {
      return <WebsiteAnalytics />;
    }
  }

  return null;
};
