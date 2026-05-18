import { useContext } from 'react';

import { TrackingConsentContext } from './tracking-consent-context';

export function useTrackingConsent() {
  return useContext(TrackingConsentContext);
}
