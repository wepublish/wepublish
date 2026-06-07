import { ComponentConfig } from '@puckeditor/core';
import { YouTubeVideoBlock } from '@wepublish/block-content/website';
import { BuilderYouTubeVideoBlockProps } from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const YouTubeConfig: ComponentConfig<{
  props: BuilderYouTubeVideoBlockProps;
  fields: UserFields;
}> = {
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
