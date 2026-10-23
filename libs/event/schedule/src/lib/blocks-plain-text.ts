import { RichtextJSONDocument, toPlaintext } from '@wepublish/richtext';

const RICH_TEXT_BLOCK_TYPE = 'richText';

const richTextOf = (block: unknown): RichtextJSONDocument | null => {
  if (!block || typeof block !== 'object') {
    return null;
  }

  const { type, richText } = block as { type?: unknown; richText?: unknown };

  if (
    type !== RICH_TEXT_BLOCK_TYPE ||
    !richText ||
    typeof richText !== 'object'
  ) {
    return null;
  }

  return richText as RichtextJSONDocument;
};

const richTextBlockTexts = (
  blocks: readonly unknown[] | null | undefined
): string[] =>
  (blocks ?? [])
    .map(richTextOf)
    .filter((richText): richText is RichtextJSONDocument => richText !== null)
    .map(richText => toPlaintext(richText) ?? '');

export const characterCount = (value: string): number => [...value].length;

export const blocksPlainText = (
  blocks: readonly unknown[] | null | undefined
): string => richTextBlockTexts(blocks).join('\n');

export const blocksTextLength = (
  blocks: readonly unknown[] | null | undefined
): number =>
  richTextBlockTexts(blocks).reduce(
    (total, text) => total + characterCount(text),
    0
  );
