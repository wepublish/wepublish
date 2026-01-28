import { compose } from 'ramda';
import { Node } from 'slate';
import { findFirstParagraph } from './truncate';

export const toPlaintext = (
  nodes: Node[] | undefined | null
): string | undefined => {
  return nodes?.map(n => Node.string(n)).join('');
};

export const firstParagraphToPlaintext = compose(
  toPlaintext,
  node => (node ? [node] : node),
  findFirstParagraph
);
