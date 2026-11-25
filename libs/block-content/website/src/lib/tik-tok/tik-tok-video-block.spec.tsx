import { screen } from '@testing-library/react';
import {
  mockTikTokVideoBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { TikTokVideoBlock } from './tik-tok-video-block';

describe('TikTokVideoBlock', () => {
  it('embeds the video through the TikTok v2 player', () => {
    renderWithProviders(
      <TikTokVideoBlock {...mockTikTokVideoBlock({ videoID: '6718335390' })} />,
      { locale: 'en' }
    );

    const player = screen.getByTitle('Embedded content from TikTok');

    expect(player).toHaveAttribute(
      'src',
      'https://www.tiktok.com/embed/v2/6718335390'
    );
    expect(player).toHaveAttribute('allowfullscreen');
  });
});
