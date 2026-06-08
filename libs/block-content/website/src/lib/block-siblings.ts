import { BlockSibling, BuilderBlocksProps } from '@wepublish/website/builder';

export const collectSiblings = (
  blocks: BuilderBlocksProps['blocks']
): BlockSibling[] =>
  blocks.map(block => ({
    typeName: block.__typename,
    blockStyle: block.blockStyle ?? undefined,
  }));
