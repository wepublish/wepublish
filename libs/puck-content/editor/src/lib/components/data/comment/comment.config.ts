import { ComponentConfig } from '@puckeditor/core';
import { CommentRender } from '@wepublish/puck-content/website';
import { BuilderCommentBlockProps } from '@wepublish/website/builder';

import { editorRender } from '../../../blocks/editor-render';
import { resolvedFieldAi } from '../../../resolved';
import { UserFields } from '../../../fields';

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

  render: editorRender(CommentRender),
};
