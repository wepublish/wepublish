import { ComponentConfig } from '@puckeditor/core';
import { StreamableVideoBlock } from '@wepublish/block-content/website';
import { BuilderStreamableVideoBlockProps } from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const StreamableConfig: ComponentConfig<{
  props: BuilderStreamableVideoBlockProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'Embeds a Streamable video player. Set videoID to the short code that follows "streamable.com/" in the video URL, not the full URL.',
  },
  fields: {
    videoID: {
      type: 'text',
      label: 'Video ID',
    },
  },
  defaultProps: {},

  render: StreamableVideoBlock,
};
