import { ComponentConfig } from '@puckeditor/core';
import { StreamableRender } from '@wepublish/puck-content/website';
import { BuilderStreamableVideoBlockProps } from '@wepublish/website/builder';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';

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

  render: editorRender(StreamableRender),
};
