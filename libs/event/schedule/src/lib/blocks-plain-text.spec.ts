import { blocksPlainText, blocksTextLength } from './blocks-plain-text';

const richTextBlock = (...paragraphs: unknown[]) => ({
  type: 'richText',
  richText: { type: 'doc', content: paragraphs },
});

const paragraph = (...content: unknown[]) => ({ type: 'paragraph', content });

const text = (value: string, marks?: unknown[]) => ({
  type: 'text',
  text: value,
  ...(marks ? { marks } : {}),
});

describe('blocksPlainText', () => {
  it('returns the text of a richText block without its markup', () => {
    expect(
      blocksPlainText([
        richTextBlock(
          paragraph(
            text('Ein '),
            text('fetter', [{ type: 'bold' }]),
            text(' Abend mit '),
            text('Link', [
              { type: 'link', attrs: { href: 'https://example.com' } },
            ])
          )
        ),
      ])
    ).toBe('Ein fetter Abend mit Link');
  });

  it('ignores blocks that are not richText', () => {
    expect(
      blocksPlainText([
        { type: 'title', title: 'Titel', lead: 'Lead' },
        richTextBlock(paragraph(text('Text'))),
        { type: 'quote', quote: 'Zitat', author: 'Autorin' },
        { type: 'html', html: '<p>HTML</p>' },
      ])
    ).toBe('Text');
  });

  it('joins several richText blocks with a line break', () => {
    expect(
      blocksPlainText([
        richTextBlock(paragraph(text('Erster'))),
        { type: 'image', imageID: 'image' },
        richTextBlock(paragraph(text('Zweiter'))),
      ])
    ).toBe('Erster\nZweiter');
  });

  it('returns an empty string for empty or missing blocks', () => {
    expect(blocksPlainText([])).toBe('');
    expect(blocksPlainText(null)).toBe('');
    expect(blocksPlainText(undefined)).toBe('');
  });

  it('skips richText blocks without a document and malformed entries', () => {
    expect(
      blocksPlainText([
        { type: 'richText', richText: null },
        { type: 'richText' },
        null,
        'richText',
        42,
        richTextBlock(paragraph(text('Bleibt'))),
      ])
    ).toBe('Bleibt');
  });
});

describe('blocksTextLength', () => {
  it('counts the text of every richText block without the separators', () => {
    expect(
      blocksTextLength([
        richTextBlock(paragraph(text('abc'))),
        richTextBlock(paragraph(text('de'))),
      ])
    ).toBe(5);
  });

  it('counts characters, not UTF-16 code units', () => {
    expect(blocksTextLength([richTextBlock(paragraph(text('Café 🎭')))])).toBe(
      6
    );
  });

  it('returns 0 for missing blocks', () => {
    expect(blocksTextLength(null)).toBe(0);
  });
});
