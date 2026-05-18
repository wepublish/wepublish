import { GoogleAnalytics } from '@next/third-parties/google';

import { FrontendTrackingProviderConfig } from '../types';

export interface GoogleAnalyticsLoaderProps {
  config: FrontendTrackingProviderConfig;
}

export function GoogleAnalyticsLoader({ config }: GoogleAnalyticsLoaderProps) {
  if (!config.ga4_measurementId) {
    return null;
  }

  return <GoogleAnalytics gaId={config.ga4_measurementId} />;
}
