import { ComponentConfig } from '@puckeditor/core';
import {
  BuilderVimeoVideoBlockProps,
  VimeoVideoBlock,
} from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const VimeoConfig: ComponentConfig<{
  props: BuilderVimeoVideoBlockProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'Embeds a Vimeo video player. Set videoID to the numeric Vimeo video identifier from the video URL (for example "76979871"), not the full URL.',
  },
  fields: {
    videoID: {
      type: 'text',
    },
  },
  defaultProps: {},

  render: VimeoVideoBlock,
};
