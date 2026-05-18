export type FrontendTrackingProviderType =
  | 'GOOGLE_ANALYTICS_4'
  | 'GOOGLE_TAG_MANAGER'
  | 'PLAUSIBLE'
  | 'PIWIK_PRO';

export interface FrontendTrackingProviderConfig {
  type: FrontendTrackingProviderType;
  ga4_measurementId?: string | null;
  gtm_containerId?: string | null;
  plausible_siteId?: string | null;
  plausible_scriptUrl?: string | null;
  piwik_containerId?: string | null;
  piwik_subdomain?: string | null;
}

export interface SparkloopConfig {
  teamId?: string | null;
  active: boolean;
}

export type ConsentMode = 'auto' | 'gated';

export type ConsentState = 'unknown' | 'granted' | 'denied';
