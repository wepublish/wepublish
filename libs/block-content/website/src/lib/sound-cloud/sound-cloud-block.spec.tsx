import { screen } from '@testing-library/react';
import {
  mockSoundCloudTrackBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { SoundCloudTrackBlock } from './sound-cloud-block';

describe('SoundCloudTrackBlock', () => {
  it('embeds the track through the visual SoundCloud widget', () => {
    renderWithProviders(
      <SoundCloudTrackBlock {...mockSoundCloudTrackBlock({ trackID: '744' })} />
    );

    const src = new URL(
      screen.getByTitle('Embedded SoundCloud Track').getAttribute('src') ?? ''
    );

    expect(src.origin + src.pathname).toBe('https://w.soundcloud.com/player/');
    expect(src.searchParams.get('url')).toBe(
      'https://api.soundcloud.com/tracks/744'
    );
    expect(src.searchParams.get('visual')).toBe('true');
  });
});
