import { ComponentConfig } from '@puckeditor/core';
import { VimeoVideoBlock } from '@wepublish/block-content/website';
import { BuilderVimeoVideoBlockProps } from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const VimeoConfig: ComponentConfig<{
  props: BuilderVimeoVideoBlockProps;
  fields: UserFields;
}> = {
  fields: {
    videoID: {
      type: 'text',
    },
  },
  defaultProps: {},

  render: VimeoVideoBlock,
};
