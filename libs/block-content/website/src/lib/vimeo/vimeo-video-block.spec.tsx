import { screen } from '@testing-library/react';
import {
  mockVimeoVideoBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { VimeoVideoBlock } from './vimeo-video-block';

describe('VimeoVideoBlock', () => {
  it('plays the video from its Vimeo url', () => {
    renderWithProviders(
      <VimeoVideoBlock {...mockVimeoVideoBlock({ videoID: '104626862' })} />
    );

    expect(
      screen.getByText('ReactPlayer Mock: https://vimeo.com/104626862')
    ).toBeInTheDocument();
  });
});
