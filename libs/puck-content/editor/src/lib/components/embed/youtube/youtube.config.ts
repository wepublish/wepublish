import { ComponentConfig } from '@puckeditor/core';
import { YouTubeRender } from '@wepublish/puck-content/website';
import { BuilderYouTubeVideoBlockProps } from '@wepublish/website/builder';
import { SiYoutube } from 'react-icons/si';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';

export const YouTubeConfig: ComponentConfig<{
  props: BuilderYouTubeVideoBlockProps;
  fields: UserFields;
}> = {
  icon: SiYoutube,
  category: 'media',
  order: 3,
  nameKey: 'puck.blocks.names.YouTube',
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

  render: editorRender(YouTubeRender),
};
