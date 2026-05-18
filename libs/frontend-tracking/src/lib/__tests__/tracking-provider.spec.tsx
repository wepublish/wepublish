import { render, screen } from '@testing-library/react';

import { TRACKING_CONSENT_STORAGE_KEY } from '../tracking-consent-context';
import { TrackingProvider } from '../tracking-provider';

jest.mock('next/script', () => {
  return function MockedScript(props: {
    id?: string;
    src?: string;
    children?: React.ReactNode;
  }) {
    return (
      <div
        data-testid={`script-${props.id ?? 'src'}`}
        data-script-src={props.src}
      >
        {props.children}
      </div>
    );
  };
});

jest.mock('@next/third-parties/google', () => ({
  GoogleAnalytics: ({ gaId }: { gaId: string }) => (
    <div
      data-testid="ga4"
      data-ga-id={gaId}
    />
  ),
  GoogleTagManager: ({ gtmId }: { gtmId: string }) => (
    <div
      data-testid="gtm"
      data-gtm-id={gtmId}
    />
  ),
}));

jest.mock('next-plausible', () => {
  return {
    __esModule: true,
    default: ({
      enabled,
      src,
      children,
    }: {
      enabled?: boolean;
      src?: string;
      children?: React.ReactNode;
    }) => (
      <div
        data-testid="plausible"
        data-plausible-enabled={enabled ? 'true' : 'false'}
        data-plausible-src={src ?? ''}
      >
        {children}
      </div>
    ),
  };
});

describe('TrackingProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('does not mount loaders before consent is granted', () => {
    render(
      <TrackingProvider
        providers={[
          { type: 'GOOGLE_ANALYTICS_4', ga4_measurementId: 'G-123' },
          { type: 'GOOGLE_TAG_MANAGER', gtm_containerId: 'GTM-456' },
        ]}
        sparkloop={null}
        consentMode="gated"
      >
        <div data-testid="children">app</div>
      </TrackingProvider>
    );

    expect(screen.getByTestId('children')).toBeTruthy();
    expect(screen.queryByTestId('ga4')).toBeNull();
    expect(screen.queryByTestId('gtm')).toBeNull();
  });

  test('mounts GA4 + GTM loaders simultaneously when consent is granted (auto mode)', () => {
    render(
      <TrackingProvider
        providers={[
          { type: 'GOOGLE_ANALYTICS_4', ga4_measurementId: 'G-123' },
          { type: 'GOOGLE_TAG_MANAGER', gtm_containerId: 'GTM-456' },
        ]}
        sparkloop={null}
        consentMode="auto"
      >
        <div>app</div>
      </TrackingProvider>
    );

    expect(screen.getByTestId('ga4').getAttribute('data-ga-id')).toBe('G-123');
    expect(screen.getByTestId('gtm').getAttribute('data-gtm-id')).toBe(
      'GTM-456'
    );
  });

  test('PlausibleProvider wraps children regardless of consent (script gated by next-plausible enabled-prop)', () => {
    render(
      <TrackingProvider
        providers={[{ type: 'PLAUSIBLE', plausible_siteId: 'example.com' }]}
        sparkloop={null}
        consentMode="gated"
      >
        <div data-testid="children">app</div>
      </TrackingProvider>
    );

    expect(screen.getByTestId('plausible')).toBeTruthy();
    expect(screen.getByTestId('children')).toBeTruthy();
  });

  test('mounts Sparkloop loader when sparkloop is active and consent granted', () => {
    render(
      <TrackingProvider
        providers={[]}
        sparkloop={{ active: true, teamId: 'team-1' }}
        consentMode="auto"
      >
        <div>app</div>
      </TrackingProvider>
    );

    expect(
      screen
        .getByTestId('script-sparkloop-team-1')
        .getAttribute('data-script-src')
    ).toBe('https://script.sparkloop.app/team_team-1.js');
  });

  test('does not mount Sparkloop loader when active=false', () => {
    render(
      <TrackingProvider
        providers={[]}
        sparkloop={{ active: false, teamId: 'team-1' }}
        consentMode="auto"
      >
        <div>app</div>
      </TrackingProvider>
    );

    expect(screen.queryByTestId('script-sparkloop-team-1')).toBeNull();
  });

  test('honors a previously-persisted consent decision from localStorage', () => {
    window.localStorage.setItem(TRACKING_CONSENT_STORAGE_KEY, 'granted');

    render(
      <TrackingProvider
        providers={[{ type: 'GOOGLE_ANALYTICS_4', ga4_measurementId: 'G-123' }]}
        sparkloop={null}
        consentMode="gated"
      >
        <div>app</div>
      </TrackingProvider>
    );

    expect(screen.getByTestId('ga4').getAttribute('data-ga-id')).toBe('G-123');
  });
});
