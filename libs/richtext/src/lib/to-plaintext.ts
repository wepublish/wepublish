import { compose } from 'ramda';
import { findFirstParagraph } from './truncate';
import { RichtextElements } from './json-format.interface';

const nodeToPlaintext = (node: unknown): string => {
  if (!node || typeof node !== 'object') {
    return '';
  }
  const { text, content, children } = node as {
    text?: unknown;
    content?: unknown;
    children?: unknown;
  };
  if (typeof text === 'string') {
    return text;
  }
  const childNodes =
    Array.isArray(content) ? content
    : Array.isArray(children) ? children
    : undefined;
  if (childNodes) {
    return childNodes.map(nodeToPlaintext).join('');
  }
  return '';
};

export const toPlaintext = (
  nodes: RichtextElements[] | null | undefined
): string | undefined => {
  if (!nodes) {
    return undefined;
  }
  return nodes.map(nodeToPlaintext).join('');
};

export const firstParagraphToPlaintext = compose(
  toPlaintext,
  node => (node ? [node] : node),
  findFirstParagraph
);
