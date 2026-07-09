import {
  RichtextElements,
  RichtextJSONDocument,
} from './json-format.interface';
import { firstParagraphToPlaintext, toPlaintext } from './to-plaintext';

describe('toPlaintext', () => {
  it('extracts nested text from a tiptap document content array', () => {
    const nodes = [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Hello ' },
          { type: 'text', text: 'tiptap' },
        ],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: ' item' }] },
            ],
          },
        ],
      },
    ] as unknown as RichtextElements[];

    expect(toPlaintext(nodes)).toBe('Hello tiptap item');
  });

  it('extracts text from a full tiptap document object (not just its content array)', () => {
    const document = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hello ' },
            { type: 'text', text: 'document' },
          ],
        },
      ],
    } as unknown as RichtextJSONDocument;

    expect(toPlaintext(document)).toBe('Hello document');
  });

  it('extracts nested text from a legacy slate node array', () => {
    const nodes = [
      {
        type: 'paragraph',
        children: [{ text: 'Hello ' }, { text: 'slate' }],
      },
    ] as unknown as RichtextElements[];

    expect(toPlaintext(nodes)).toBe('Hello slate');
  });

  it('concatenates a flat array of text nodes (backwards compatible)', () => {
    const nodes = [
      { type: 'text', text: 'a' },
      { type: 'text', text: 'b' },
    ] as unknown as RichtextElements[];

    expect(toPlaintext(nodes)).toBe('ab');
  });

  it('returns an empty string for an empty array', () => {
    expect(toPlaintext([])).toBe('');
  });

  it('returns undefined for null or undefined input', () => {
    expect(toPlaintext(null)).toBeUndefined();
    expect(toPlaintext(undefined)).toBeUndefined();
  });
});

describe('firstParagraphToPlaintext', () => {
  it('returns the deep text of the first paragraph, skipping other nodes', () => {
    const nodes = [
      { type: 'heading', content: [{ type: 'text', text: 'Title' }] },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'First ' },
          { type: 'text', text: 'paragraph' },
        ],
      },
      { type: 'paragraph', content: [{ type: 'text', text: 'Second' }] },
    ] as unknown as RichtextElements[];

    expect(firstParagraphToPlaintext(nodes)).toBe('First paragraph');
  });
});
