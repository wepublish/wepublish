import { act, render, screen } from '@testing-library/react';
import { useContext } from 'react';

import {
  TRACKING_CONSENT_STORAGE_KEY,
  TrackingConsentContext,
  TrackingConsentProvider,
} from '../tracking-consent-context';

function ConsentReadout() {
  const { consent, setConsent, reset } = useContext(TrackingConsentContext);

  return (
    <div>
      <output data-testid="state">{consent}</output>
      <button
        data-testid="grant"
        onClick={() => setConsent(true)}
      >
        grant
      </button>
      <button
        data-testid="deny"
        onClick={() => setConsent(false)}
      >
        deny
      </button>
      <button
        data-testid="reset"
        onClick={reset}
      >
        reset
      </button>
    </div>
  );
}

describe('TrackingConsentProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('consentMode=auto flips immediately to granted', () => {
    render(
      <TrackingConsentProvider mode="auto">
        <ConsentReadout />
      </TrackingConsentProvider>
    );

    expect(screen.getByTestId('state').textContent).toBe('granted');
  });

  test('consentMode=gated stays unknown until setConsent is called', () => {
    render(
      <TrackingConsentProvider mode="gated">
        <ConsentReadout />
      </TrackingConsentProvider>
    );

    expect(screen.getByTestId('state').textContent).toBe('unknown');

    act(() => {
      screen.getByTestId('grant').click();
    });

    expect(screen.getByTestId('state').textContent).toBe('granted');
    expect(window.localStorage.getItem(TRACKING_CONSENT_STORAGE_KEY)).toBe(
      'granted'
    );
  });

  test('consentMode=gated reads previously-persisted decision from localStorage', () => {
    window.localStorage.setItem(TRACKING_CONSENT_STORAGE_KEY, 'denied');

    render(
      <TrackingConsentProvider mode="gated">
        <ConsentReadout />
      </TrackingConsentProvider>
    );

    expect(screen.getByTestId('state').textContent).toBe('denied');
  });

  test('reset() clears storage and reverts to unknown', () => {
    window.localStorage.setItem(TRACKING_CONSENT_STORAGE_KEY, 'granted');

    render(
      <TrackingConsentProvider mode="gated">
        <ConsentReadout />
      </TrackingConsentProvider>
    );

    expect(screen.getByTestId('state').textContent).toBe('granted');

    act(() => {
      screen.getByTestId('reset').click();
    });

    expect(screen.getByTestId('state').textContent).toBe('unknown');
    expect(
      window.localStorage.getItem(TRACKING_CONSENT_STORAGE_KEY)
    ).toBeNull();
  });
});
