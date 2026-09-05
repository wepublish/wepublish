import { ComponentConfig } from '@puckeditor/core';
import { YouTubeVideoBlock } from '@wepublish/block-content/website';
import { BuilderYouTubeVideoBlockProps } from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const YouTubeConfig: ComponentConfig<{
  props: BuilderYouTubeVideoBlockProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'Embeds a YouTube video player. Set videoID to the YouTube video identifier, i.e. the "v" query parameter or the last path segment of a youtu.be link (for example "L7Yea1Qg5Lo"), not the full URL.',
  },
  fields: {
    videoID: {
      type: 'text',
    },
  },
  defaultProps: {
    videoID: 'L7Yea1Qg5Lo',
  },

  render: YouTubeVideoBlock,
};
