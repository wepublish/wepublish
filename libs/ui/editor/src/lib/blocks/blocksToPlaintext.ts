import { EditorBlockType } from '@wepublish/editor/api';
import { RichtextJSONDocument, toPlaintext } from '@wepublish/richtext';

import { BlockValue } from './types';

const richTextToPlaintext = (
  richText: RichtextJSONDocument | null | undefined
) =>
  (richText?.content ?? [])
    .map(node => toPlaintext([node])?.trim())
    .filter(Boolean)
    .join('\n');

const blockToPlaintext = (block: BlockValue): string[] => {
  if (block.value?.disabled) {
    return [];
  }

  switch (block.type) {
    case EditorBlockType.Title:
      return [block.value.preTitle, block.value.title, block.value.lead];
    case EditorBlockType.RichText:
      return [richTextToPlaintext(block.value.richText)];
    case EditorBlockType.Quote:
      return [block.value.quote, block.value.author];
    case EditorBlockType.Listicle:
      return block.value.items.flatMap(({ value }) => [
        value.title ?? '',
        richTextToPlaintext(value.richText),
      ]);
    default:
      return [];
  }
};

export const blocksToPlaintext = (blocks: BlockValue[]) =>
  blocks
    .flatMap(blockToPlaintext)
    .map(text => text?.trim())
    .filter(Boolean)
    .join('\n');
