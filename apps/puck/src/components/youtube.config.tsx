import { ComponentConfig } from '@puckeditor/core';
import { YouTubeVideoBlock } from '@wepublish/block-content/website';
import { BuilderYouTubeVideoBlockProps } from '@wepublish/website/builder';

export const YouTubeConfig: ComponentConfig<BuilderYouTubeVideoBlockProps> = {
  fields: {
    videoID: {
      type: 'text',
    },
  },
  defaultProps: {
    videoID: 'L7Yea1Qg5Lo',
  },
  inline: true,
  render: YouTubeVideoBlock,
};
