import { screen } from '@testing-library/react';
import {
  mockYouTubeVideoBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { YouTubeVideoBlock } from './youtube-video-block';

describe('YouTubeVideoBlock', () => {
  it('plays the video from its YouTube watch url', () => {
    renderWithProviders(
      <YouTubeVideoBlock
        {...mockYouTubeVideoBlock({ videoID: 'CCOdQsZa15o' })}
      />
    );

    expect(
      screen.getByText(
        'ReactPlayer Mock: https://www.youtube.com/watch?v=CCOdQsZa15o'
      )
    ).toBeInTheDocument();
  });
});
