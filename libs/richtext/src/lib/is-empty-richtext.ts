import {
  RichtextElements,
  RichtextJSONDocument,
} from './json-format.interface';

type LooseNode = { type?: unknown; text?: unknown; content?: unknown };

const isBlankInline = (node: LooseNode) =>
  node.type === 'hardBreak' ||
  (node.type === 'text' &&
    (typeof node.text !== 'string' || !node.text.trim()));

const isBlankParagraph = (node: LooseNode) =>
  node.type === 'paragraph' &&
  (!Array.isArray(node.content) ||
    (node.content as LooseNode[]).every(isBlankInline));

/**
 * The editor saves a cleared richtext field as a doc with one empty paragraph
 * (it never saves `null`). This treats such docs as empty — and only them:
 * any node besides blank paragraphs (an image, an embed, a list...) counts as
 * content even without text, unlike a `toPlaintext` check.
 */
export const isEmptyRichtext = (
  nodes: RichtextElements[] | RichtextJSONDocument | null | undefined
): boolean => {
  if (!nodes) {
    return true;
  }

  const topLevel = (
    Array.isArray(nodes) ? nodes : (
      ((nodes as LooseNode).content ?? [])
    )) as LooseNode[];

  return !Array.isArray(topLevel) || topLevel.every(isBlankParagraph);
};
