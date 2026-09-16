import { describe, expect, it } from 'vitest';

import { extractFactAnchors, richtextToText } from './fact-anchors';

describe('extractFactAnchors', () => {
  it('finds capitalised word pairs in order, once each', () => {
    const anchors = extractFactAnchors([
      'Conradin Cramer eröffnet das Schulhaus. Conradin Cramer sagt: Basel wächst.',
      'Die Regierungsrätin Stephanie Eymann widerspricht.',
    ]);

    expect(anchors).toEqual([
      'Conradin Cramer',
      'Regierungsrätin Stephanie',
      'Stephanie Eymann',
    ]);
  });

  it('skips pairs that start with a sentence-initial stop word', () => {
    expect(
      extractFactAnchors(['Die Stadt Basel. Im Klybeck wird gebaut.'])
    ).toEqual(['Stadt Basel']);
  });

  it('ignores single capitalised words and empty input', () => {
    expect(extractFactAnchors(['Basel wächst.', ''])).toEqual([]);
  });
});

describe('richtextToText', () => {
  it('joins the text nodes of a tiptap document with spaces', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Conradin' },
            { type: 'text', text: 'Cramer' },
          ],
        },
        { type: 'paragraph', content: [{ type: 'text', text: 'Basel' }] },
      ],
    } as never;

    expect(richtextToText(doc)).toBe('Conradin Cramer Basel');
  });

  it('returns an empty string for nothing', () => {
    expect(richtextToText(null)).toBe('');
  });
});
