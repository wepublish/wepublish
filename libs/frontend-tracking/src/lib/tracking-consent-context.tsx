import {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useState,
} from 'react';

import { ConsentMode, ConsentState } from './types';

export interface TrackingConsentValue {
  consent: ConsentState;
  setConsent: (granted: boolean) => void;
  reset: () => void;
}

export const TRACKING_CONSENT_STORAGE_KEY = 'wepublish.tracking.consent.v1';

export const TrackingConsentContext = createContext<TrackingConsentValue>({
  consent: 'unknown',
  setConsent: () => undefined,
  reset: () => undefined,
});

export interface TrackingConsentProviderProps {
  mode: ConsentMode;
  children: ReactNode;
}

export function TrackingConsentProvider({
  mode,
  children,
}: TrackingConsentProviderProps) {
  const [consent, setConsentState] = useState<ConsentState>('unknown');

  useEffect(() => {
    if (mode === 'auto') {
      setConsentState('granted');
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const stored = window.localStorage.getItem(TRACKING_CONSENT_STORAGE_KEY);

    if (stored === 'granted' || stored === 'denied') {
      setConsentState(stored);
    }
  }, [mode]);

  const setConsent = useCallback((granted: boolean) => {
    const next: ConsentState = granted ? 'granted' : 'denied';

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TRACKING_CONSENT_STORAGE_KEY, next);
    }

    setConsentState(next);
  }, []);

  const reset = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TRACKING_CONSENT_STORAGE_KEY);
    }

    setConsentState('unknown');
  }, []);

  return (
    <TrackingConsentContext.Provider value={{ consent, setConsent, reset }}>
      {children}
    </TrackingConsentContext.Provider>
  );
}
