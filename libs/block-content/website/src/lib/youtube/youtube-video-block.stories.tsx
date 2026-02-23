import { Meta } from '@storybook/react';
import { YouTubeVideoBlock } from './youtube-video-block';
import { mockYouTubeVideoBlock } from '@wepublish/storybook/mocks';

export default {
  component: YouTubeVideoBlock,
  title: 'Blocks/YouTube',
} as Meta;

export const Default = {
  args: mockYouTubeVideoBlock(),
  parameters: {
    chromatic: { disableSnapshot: true }, // loads live YouTube embed — snapshot would always differ
  },
};
