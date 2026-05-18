import { GoogleTagManager } from '@next/third-parties/google';

import { FrontendTrackingProviderConfig } from '../types';

export interface GoogleTagManagerLoaderProps {
  config: FrontendTrackingProviderConfig;
}

export function GoogleTagManagerLoader({
  config,
}: GoogleTagManagerLoaderProps) {
  if (!config.gtm_containerId) {
    return null;
  }

  return <GoogleTagManager gtmId={config.gtm_containerId} />;
}
