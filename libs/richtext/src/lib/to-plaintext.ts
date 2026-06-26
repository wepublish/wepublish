import { findFirstParagraph } from './truncate';
import {
  RichtextElements,
  RichtextJSONDocument,
} from './json-format.interface';

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
  nodes: RichtextElements[] | RichtextJSONDocument | null | undefined
): string | undefined => {
  if (!nodes) {
    return undefined;
  }
  if (Array.isArray(nodes)) {
    return nodes.map(nodeToPlaintext).join('');
  }
  return nodeToPlaintext(nodes);
};

export const firstParagraphToPlaintext = (
  nodes: RichtextElements[]
): string | undefined => {
  const paragraph = findFirstParagraph(nodes);
  return paragraph ? toPlaintext([paragraph]) : undefined;
};
