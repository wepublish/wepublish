import { ComponentConfig } from '@puckeditor/core';
import { CommentBlock } from '@wepublish/block-content/website';
import { BuilderCommentBlockProps } from '@wepublish/website/builder';

import { resolvedFieldAi } from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';

export const CommentConfig: ComponentConfig<{
  props: BuilderCommentBlockProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'Shows a list of reader comments. The comments are loaded automatically and cannot be edited here.',
  },
  fields: {
    comments: {
      type: 'resolved',
      visible: false,
      ai: resolvedFieldAi,
    },
  },
  defaultProps: {
    comments: [],
  },

  render: CommentBlock,
};
