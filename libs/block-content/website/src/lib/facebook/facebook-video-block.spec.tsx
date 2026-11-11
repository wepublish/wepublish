import { screen } from '@testing-library/react';
import {
  mockFacebookVideoBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FacebookVideoBlock } from './facebook-video-block';

describe('FacebookVideoBlock', () => {
  it('embeds the video through the Facebook video plugin without its text', () => {
    renderWithProviders(
      <FacebookVideoBlock
        {...mockFacebookVideoBlock({ userID: 'wepublish', videoID: '42' })}
      />
    );

    const player = screen.getByTitle('Embedded Facebook Video');
    const src = new URL(player.getAttribute('src') ?? '');

    expect(src.origin + src.pathname).toBe(
      'https://www.facebook.com/plugins/video.php'
    );
    expect(src.searchParams.get('href')).toBe(
      'https://www.facebook.com/wepublish/videos/42/'
    );
    expect(src.searchParams.get('show_text')).toBe('false');
    expect(player).toHaveAttribute('allowfullscreen');
  });
});
