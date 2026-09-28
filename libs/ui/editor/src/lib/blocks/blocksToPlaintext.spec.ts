import { EditorBlockType } from '@wepublish/editor/api';

import { blocksToPlaintext } from './blocksToPlaintext';
import { BlockValue } from './types';

const paragraph = (text: string) => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
});

describe('blocksToPlaintext', () => {
  test('extracts text from content blocks and separates paragraphs', () => {
    const blocks = [
      {
        key: '1',
        type: EditorBlockType.Title,
        value: { preTitle: '', title: 'Title', lead: 'Lead' },
      },
      {
        key: '2',
        type: EditorBlockType.RichText,
        value: {
          richText: {
            type: 'doc',
            content: [paragraph('First.'), paragraph('Second.')],
          },
        },
      },
      {
        key: '3',
        type: EditorBlockType.Quote,
        value: { quote: 'Quote', author: 'Author' },
      },
      {
        key: '4',
        type: EditorBlockType.RichText,
        value: {
          disabled: true,
          richText: { type: 'doc', content: [paragraph('Hidden')] },
        },
      },
      {
        key: '5',
        type: EditorBlockType.HTML,
        value: { html: '<p>Ignored</p>' },
      },
    ] as unknown as BlockValue[];

    expect(blocksToPlaintext(blocks)).toBe(
      'Title\nLead\nFirst.\nSecond.\nQuote\nAuthor'
    );
  });

  test('returns an empty string without blocks', () => {
    expect(blocksToPlaintext([])).toBe('');
  });
});
