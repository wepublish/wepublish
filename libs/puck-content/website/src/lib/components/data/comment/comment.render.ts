import {
  BuilderCommentBlockProps,
  CommentBlock,
} from '@wepublish/website/builder';

import { builderBlock } from '../../../blocks/builder-block';

export const CommentRender =
  builderBlock<BuilderCommentBlockProps>(CommentBlock);
