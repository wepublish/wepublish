import { ComponentConfig } from '@puckeditor/core';
import { TikTokVideoBlock } from '@wepublish/block-content/website';
import { BuilderTikTokVideoBlockProps } from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const TikTokConfig: ComponentConfig<{
  props: BuilderTikTokVideoBlockProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'Embeds a TikTok video. Set videoID to the numeric video identifier and userID to the account handle (without the leading @) taken from the TikTok video URL "tiktok.com/@userID/video/videoID".',
  },
  fields: {
    videoID: {
      type: 'text',
    },
    userID: {
      type: 'text',
    },
  },
  defaultProps: {},

  render: TikTokVideoBlock,
};
