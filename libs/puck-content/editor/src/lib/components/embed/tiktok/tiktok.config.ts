import { ComponentConfig } from '@puckeditor/core';
import { TikTokRender } from '@wepublish/puck-content/website';
import { BuilderTikTokVideoBlockProps } from '@wepublish/website/builder';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';

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

  render: editorRender(TikTokRender),
};
