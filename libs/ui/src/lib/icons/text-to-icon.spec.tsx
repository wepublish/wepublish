import { screen } from '@testing-library/react';
import { renderWithProviders } from '@wepublish/mocks/website';

import { TextToIcon } from './text-to-icon';

const iconsFor = (titles: string[]) =>
  titles.map(title => {
    const { container, unmount } = renderWithProviders(
      <TextToIcon
        title={title}
        size={22}
      />
    );
    const svg = container.querySelector('svg');
    const markup = svg?.innerHTML;

    unmount();

    return markup;
  });

describe('TextToIcon', () => {
  it.each([
    'x',
    'tiktok',
    'facebook',
    'instagram',
    'linkedin',
    'bluesky',
    'github',
    'reddit',
    'spotify',
    'amazon',
    'vimeo',
    'youtube',
    'discord',
    'strava',
    'mail',
    'website',
    'trustj',
    'search',
    'apple-store',
    'play-store',
  ])('renders a labelled icon for %s', title => {
    renderWithProviders(
      <TextToIcon
        title={title}
        size={22}
      />
    );

    const icon = screen.getByLabelText(title);
    expect(icon).toBeInstanceOf(SVGElement);
    expect(icon).toHaveAttribute('width', '22');
  });

  it('gives every known title its own icon', () => {
    const icons = iconsFor([
      'x',
      'tiktok',
      'facebook',
      'instagram',
      'linkedin',
      'bluesky',
      'github',
      'reddit',
      'spotify',
      'amazon',
      'vimeo',
      'youtube',
      'discord',
      'strava',
      'mail',
      'website',
      'trustj',
      'search',
      'apple-store',
      'play-store',
    ]);

    expect(new Set(icons).size).toBe(icons.length);
  });

  it.each([
    ['twitter', 'x'],
    ['e-mail', 'mail'],
    ['email', 'mail'],
    ['webseite', 'website'],
    ['presseausweis', 'trustj'],
    ['suche', 'search'],
    ['GitHub', 'github'],
  ])('renders the same icon for %s as for %s', (alias, canonical) => {
    const [aliasIcon, canonicalIcon] = iconsFor([alias, canonical]);

    expect(aliasIcon).toBeDefined();
    expect(aliasIcon).toBe(canonicalIcon);
  });

  it('falls back to the title text for unknown titles', () => {
    const { container } = renderWithProviders(
      <TextToIcon
        title="mastodon"
        size={22}
      />
    );

    expect(screen.getByText('mastodon')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeNull();
  });
});
