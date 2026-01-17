import { ComponentConfig } from '@puckeditor/core';
import { VimeoVideoBlock } from '@wepublish/block-content/website';
import { BuilderVimeoVideoBlockProps } from '@wepublish/website/builder';

export const VimeoConfig: ComponentConfig<BuilderVimeoVideoBlockProps> = {
  fields: {
    videoID: {
      type: 'text',
    },
  },
  defaultProps: {},
  inline: true,
  render: VimeoVideoBlock,
};
