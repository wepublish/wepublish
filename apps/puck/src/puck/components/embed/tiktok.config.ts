import { ComponentConfig } from '@puckeditor/core';
import { TikTokVideoBlock } from '@wepublish/block-content/website';
import { BuilderTikTokVideoBlockProps } from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const TikTokConfig: ComponentConfig<{
  props: BuilderTikTokVideoBlockProps;
  fields: UserFields;
}> = {
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
