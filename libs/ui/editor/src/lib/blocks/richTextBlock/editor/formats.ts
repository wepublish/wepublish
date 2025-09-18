import { BlockFormat, InlineFormat, TextFormat } from '@wepublish/richtext';

export type Format = BlockFormat | InlineFormat | TextFormat;

export const BlockFormats: string[] = Object.values(BlockFormat);
export const InlineFormats: string[] = Object.values(InlineFormat);
export const TextFormats: string[] = Object.values(TextFormat);
export const ListFormats: string[] = [
  BlockFormat.UnorderedList,
  BlockFormat.OrderedList,
];
