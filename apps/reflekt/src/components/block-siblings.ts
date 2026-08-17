import { FullBlockFragment } from '@wepublish/website/api';

export type BlockSibling = {
  typeName: string;
  blockStyle?: string;
};

export const collectSiblings = (blocks: FullBlockFragment[]): BlockSibling[] =>
  blocks.map(b => ({
    typeName: b.__typename,
    blockStyle: b.blockStyle,
  })) as BlockSibling[];
