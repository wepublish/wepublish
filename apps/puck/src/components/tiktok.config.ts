import { ComponentConfig } from '@puckeditor/core';
import { TikTokVideoBlock } from '@wepublish/block-content/website';
import { BuilderTikTokVideoBlockProps } from '@wepublish/website/builder';

export const TikTokConfig: ComponentConfig<BuilderTikTokVideoBlockProps> = {
  fields: {
    videoID: {
      type: 'text',
    },
    userID: {
      type: 'text',
    },
  },
  defaultProps: {},
  inline: true,
  render: TikTokVideoBlock,
};
