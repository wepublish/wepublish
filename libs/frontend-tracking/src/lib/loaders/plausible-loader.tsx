import PlausibleProvider from 'next-plausible';
import { ReactNode } from 'react';

import { FrontendTrackingProviderConfig } from '../types';

export interface PlausibleLoaderProps {
  config: FrontendTrackingProviderConfig;
  children?: ReactNode;
}

export function PlausibleLoader({ config, children }: PlausibleLoaderProps) {
  const enabled = !!config.plausible_siteId;

  const src =
    config.plausible_scriptUrl ||
    (config.plausible_siteId ?
      `https://plausible.io/js/${config.plausible_siteId}.js`
    : undefined);

  return (
    <PlausibleProvider
      enabled={enabled}
      src={src}
    >
      {children ?? null}
    </PlausibleProvider>
  );
}
