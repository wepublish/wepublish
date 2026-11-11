import { render } from '@testing-library/react';
import { WebsiteSettingsFragment } from '@wepublish/website/api';
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
});
