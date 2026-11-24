import { render } from '@testing-library/react';
import { WebsiteSettingsFragment } from '@wepublish/website/api';
import {
  UMAMI_BEFORE_SEND,
  umamiBeforeSendScript,
} from '../lib/umami-before-send';
import { Analytics } from './analytics';

const off = { enabled: false, key: 'key' };

const settings = (
  overrides: Partial<WebsiteSettingsFragment['analytics']> = {}
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
    ads: { sparkLoop: off },
  }) as WebsiteSettingsFragment;

describe('Analytics', () => {
  it('renders nothing with everything disabled', () => {
    expect(
      render(<Analytics websiteSettings={settings()} />).container.innerHTML
    ).toBe('');
  });

  it('renders nothing for Umami without a key', () => {
    const { container } = render(
      <Analytics
        websiteSettings={settings({ umami: { enabled: true, key: '' } })}
      />
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders Plausible and calls plausible.init', () => {
    render(
      <Analytics
        websiteSettings={settings({
          plausible: { enabled: true, key: 'pa-123' },
        })}
      />
    );

    expect(
      document.querySelector('#plausible-script')?.getAttribute('src')
    ).toBe('https://plausible.io/js/pa-123.js');
    expect(document.querySelector('#plausible-init')?.innerHTML).toContain(
      'plausible.init()'
    );
  });

  it('renders Umami with the website id', () => {
    const { container } = render(
      <Analytics
        websiteSettings={settings({
          umami: { enabled: true, key: 'website-id' },
        })}
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
      <Analytics
        websiteSettings={settings({
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
      <Analytics
        websiteSettings={settings({
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
});
