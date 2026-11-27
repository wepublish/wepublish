import { render } from '@testing-library/react';
import { WebsiteSettingsFragment } from '@wepublish/website/api';
import {
  UMAMI_BEFORE_SEND,
  umamiBeforeSendScript,
} from '../lib/umami-before-send';
import { ThirdPartyScripts } from './third-party-scripts';

vi.mock('next/script', () => ({
  default: ({
    children,
    strategy,
    ...props
  }: {
    children?: string;
    strategy?: string;
  }) => (
    <script
      data-strategy={strategy}
      {...props}
    >
      {children}
    </script>
  ),
}));

vi.mock('@next/third-parties/google', () => ({
  GoogleAnalytics: ({ gaId }: { gaId: string }) => (
    <script data-testid={`ga:${gaId}`} />
  ),
  GoogleTagManager: ({ gtmId }: { gtmId: string }) => (
    <script data-testid={`gtm:${gtmId}`} />
  ),
}));

const off = { enabled: false, key: 'key' };

const settings = (
  overrides: Partial<WebsiteSettingsFragment['analytics']> = {},
  sparkLoop = off
) =>
  ({
    analytics: {
      googleAnalytics: off,
      googleTagManager: off,
      plausible: off,
      piwik: off,
      umami: off,
      ...overrides,
    },
    ads: { sparkLoop },
  }) as WebsiteSettingsFragment;

describe('ThirdPartyScripts', () => {
  it('renders nothing without settings or with everything disabled', () => {
    expect(render(<ThirdPartyScripts />).container.innerHTML).toBe('');
    expect(
      render(<ThirdPartyScripts settings={settings()} />).container.innerHTML
    ).toBe('');
  });

  it('renders nothing for an enabled script without a key', () => {
    const { container } = render(
      <ThirdPartyScripts
        settings={settings({ umami: { enabled: true, key: '' } })}
      />
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders Google Analytics and Google Tag Manager', () => {
    const { getByTestId } = render(
      <ThirdPartyScripts
        settings={settings({
          googleAnalytics: { enabled: true, key: 'G-123' },
          googleTagManager: { enabled: true, key: 'GTM-123' },
        })}
      />
    );

    expect(getByTestId('ga:G-123')).toBeTruthy();
    expect(getByTestId('gtm:GTM-123')).toBeTruthy();
  });

  it('renders Umami with the website id', () => {
    const { container } = render(
      <ThirdPartyScripts
        settings={settings({ umami: { enabled: true, key: 'website-id' } })}
      />
    );
    const script = container.querySelector('script');

    expect(script?.getAttribute('src')).toBe(
      'https://cloud.umami.is/script.js'
    );
    expect(script?.getAttribute('data-website-id')).toBe('website-id');
  });

  it('renders Umami without a before-send hook when no params are excluded', () => {
    const { container } = render(
      <ThirdPartyScripts
        settings={settings({
          umami: { enabled: true, key: 'website-id', excludedSearchParams: [] },
        })}
      />
    );

    expect(container.querySelectorAll('script')).toHaveLength(1);
    expect(
      container.querySelector('script')?.hasAttribute('data-before-send')
    ).toBe(false);
  });

  it('strips the excluded search params in a hook defined before Umami', () => {
    const { container } = render(
      <ThirdPartyScripts
        settings={settings({
          umami: {
            enabled: true,
            key: 'website-id',
            excludedSearchParams: ['mail', 'firstName'],
          },
        })}
      />
    );
    const [hook, umami] = Array.from(container.querySelectorAll('script'));

    expect(hook.id).toBe('umami-before-send');
    expect(hook.textContent).toBe(umamiBeforeSendScript(['mail', 'firstName']));
    expect(umami.getAttribute('src')).toBe('https://cloud.umami.is/script.js');
    expect(umami.getAttribute('data-before-send')).toBe(UMAMI_BEFORE_SEND);
  });

  it('renders Piwik PRO with the container id', () => {
    const { container } = render(
      <ThirdPartyScripts
        settings={settings({ piwik: { enabled: true, key: 'piwik-id' } })}
      />
    );
    const script = container.querySelector('#piwik-pro');

    expect(script?.textContent).toContain(`'piwik-id'`);
  });

  it('renders SparkLoop', () => {
    const { container } = render(
      <ThirdPartyScripts
        settings={settings({}, { enabled: true, key: 'pub-1' })}
      />
    );

    expect(container.querySelector('script')?.getAttribute('src')).toBe(
      'https://script.sparkloop.app/embed.js?publication_id=pub-1.js'
    );
  });
});
