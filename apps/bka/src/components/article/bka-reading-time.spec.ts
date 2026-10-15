import { countWords, readingTimeInMinutes } from './bka-reading-time';

const paragraph = (text: string) => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text }],
    },
  ],
});

const words = (count: number) =>
  Array.from({ length: count }, (_, index) => `word${index}`).join(' ');

describe('countWords', () => {
  it('counts words across nested rich text nodes', () => {
    expect(countWords(paragraph('eins zwei drei'))).toBe(3);
  });

  it('ignores markup that carries no text', () => {
    expect(
      countWords({ type: 'doc', content: [{ type: 'horizontalRule' }] })
    ).toBe(0);
  });

  it('returns 0 for empty or malformed input', () => {
    expect(countWords(null)).toBe(0);
    expect(countWords(undefined)).toBe(0);
    expect(countWords({})).toBe(0);
  });
});

describe('readingTimeInMinutes', () => {
  it('rounds up so a part-filled minute still counts', () => {
    // 243 words is the real "Im Bild Nº18" article, which bka.ch labels
    // "2 Minuten Lesedauer". Rounding instead of ceiling would yield 1.
    expect(readingTimeInMinutes([{ richText: paragraph(words(243)) }])).toBe(2);
  });

  it('sums every rich text block on the article', () => {
    expect(
      readingTimeInMinutes([
        { richText: paragraph(words(150)) },
        { richText: paragraph(words(150)) },
      ])
    ).toBe(2);
  });

  it('skips blocks without rich text', () => {
    expect(
      readingTimeInMinutes([
        { __typename: 'ImageBlock' },
        { richText: paragraph(words(100)) },
      ])
    ).toBe(1);
  });

  it('never reports less than a minute', () => {
    expect(readingTimeInMinutes([])).toBe(1);
    expect(readingTimeInMinutes([{ richText: paragraph('kurz') }])).toBe(1);
  });
});
