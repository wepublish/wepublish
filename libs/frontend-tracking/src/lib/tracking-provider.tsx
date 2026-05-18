import { ReactNode, useContext } from 'react';

import { GoogleAnalyticsLoader } from './loaders/google-analytics-loader';
import { GoogleTagManagerLoader } from './loaders/google-tag-manager-loader';
import { PiwikProLoader } from './loaders/piwik-pro-loader';
import { PlausibleLoader } from './loaders/plausible-loader';
import { SparkloopLoader } from './loaders/sparkloop-loader';
import {
  TrackingConsentContext,
  TrackingConsentProvider,
} from './tracking-consent-context';
import {
  ConsentMode,
  FrontendTrackingProviderConfig,
  SparkloopConfig,
} from './types';

export interface TrackingProviderProps {
  providers: FrontendTrackingProviderConfig[];
  sparkloop?: SparkloopConfig | null;
  consentMode?: ConsentMode;
  children: ReactNode;
}

export function TrackingProvider({
  providers,
  sparkloop,
  consentMode = 'gated',
  children,
}: TrackingProviderProps) {
  const plausibleProvider = providers.find(p => p.type === 'PLAUSIBLE');
  const otherProviders = providers.filter(p => p.type !== 'PLAUSIBLE');

  const consentMounted = (
    <>
      {otherProviders.map(provider => (
        <ProviderLoader
          key={provider.type}
          config={provider}
        />
      ))}

      {sparkloop?.active && sparkloop.teamId && (
        <SparkloopLoader teamId={sparkloop.teamId} />
      )}
    </>
  );

  if (plausibleProvider) {
    return (
      <TrackingConsentProvider mode={consentMode}>
        <PlausibleLoader config={plausibleProvider}>
          <ConsentGate>{consentMounted}</ConsentGate>
          {children}
        </PlausibleLoader>
      </TrackingConsentProvider>
    );
  }

  return (
    <TrackingConsentProvider mode={consentMode}>
      <ConsentGate>{consentMounted}</ConsentGate>
      {children}
    </TrackingConsentProvider>
  );
}

function ConsentGate({ children }: { children: ReactNode }) {
  const { consent } = useContext(TrackingConsentContext);

  if (consent !== 'granted') {
    return null;
  }

  return children;
}

function ProviderLoader({
  config,
}: {
  config: FrontendTrackingProviderConfig;
}) {
  switch (config.type) {
    case 'GOOGLE_ANALYTICS_4':
      return <GoogleAnalyticsLoader config={config} />;
    case 'GOOGLE_TAG_MANAGER':
      return <GoogleTagManagerLoader config={config} />;
    case 'PIWIK_PRO':
      return <PiwikProLoader config={config} />;
    case 'PLAUSIBLE':
      return null;
    default:
      return null;
  }
}
