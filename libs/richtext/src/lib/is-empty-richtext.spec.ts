import { isEmptyRichtext } from './is-empty-richtext';

describe('isEmptyRichtext', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a doc without content', { type: 'doc' }],
    ['a doc with an empty content array', { type: 'doc', content: [] }],
    // what the editor saves for a cleared field
    [
      'a doc with one paragraph without content',
      { type: 'doc', content: [{ type: 'paragraph' }] },
    ],
    [
      'a doc with one paragraph with an empty content array',
      { type: 'doc', content: [{ type: 'paragraph', content: [] }] },
    ],
    [
      'paragraphs holding only whitespace and line breaks',
      {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: '  ' }] },
          { type: 'paragraph', content: [{ type: 'hardBreak' }] },
        ],
      },
    ],
    ['an empty node array', []],
  ])('treats %s as empty', (_, value) => {
    expect(isEmptyRichtext(value as never)).toBe(true);
  });

  it.each([
    [
      'a paragraph with text',
      {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Hi' }] },
        ],
      },
    ],
    [
      'an image without any text',
      {
        type: 'doc',
        content: [
          { type: 'image', attrs: { src: 'https://example.com/a.png' } },
        ],
      },
    ],
    [
      'an empty paragraph followed by an embed',
      {
        type: 'doc',
        content: [{ type: 'paragraph' }, { type: 'horizontalRule' }],
      },
    ],
    [
      'a node array with a paragraph with text',
      [{ type: 'paragraph', content: [{ type: 'text', text: 'Hi' }] }],
    ],
  ])('does not treat %s as empty', (_, value) => {
    expect(isEmptyRichtext(value as never)).toBe(false);
  });
});
