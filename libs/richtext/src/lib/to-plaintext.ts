import { compose } from 'ramda';
import { findFirstParagraph } from './truncate';
import { RichtextElements } from './json-format.interface';

export const toPlaintext = (
  nodes: RichtextElements[] | null | undefined
): string | undefined => {
  return nodes?.flatMap(n => (n.type === 'text' ? n.text : [])).join('');
};

export const firstParagraphToPlaintext = compose(
  toPlaintext,
  node => (node ? [node] : node),
  findFirstParagraph
);
