import {
  BuilderRichTextBlockProps,
  RichTextBlock,
} from '@wepublish/website/builder';

import { builderBlock } from '../../../blocks/builder-block';

export type RichTextConfigProps = Pick<BuilderRichTextBlockProps, 'richText'>;

export const RichTextRender = builderBlock<RichTextConfigProps>(RichTextBlock);
