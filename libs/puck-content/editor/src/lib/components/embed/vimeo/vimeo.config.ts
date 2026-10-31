import { ComponentConfig } from '@puckeditor/core';
import { VimeoRender } from '@wepublish/puck-content/website';
import { BuilderVimeoVideoBlockProps } from '@wepublish/website/builder';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';

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

  render: editorRender(VimeoRender),
};
