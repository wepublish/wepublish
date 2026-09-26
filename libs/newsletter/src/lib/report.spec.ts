import { documentText, htmlBytes, newsletterReport } from './report';

describe('report', () => {
  it('counts utf-8 bytes rather than characters', () => {
    expect(htmlBytes('ä')).toBe(2);
    expect(htmlBytes('abc')).toBe(3);
  });

  it('names the missing footer tags by key', () => {
    expect(newsletterReport('<p>*|UNSUB|*</p>', ['a'], [])).toEqual({
      bytes: 16,
      missingFooter: ['address'],
      missingArticles: ['a'],
      missingImages: [],
    });
  });

  it('joins every string of the document', () => {
    const text = documentText({
      preheader: 'pre',
      blocks: [{ type: 'footer', title: 'T', lines: ['*|UNSUB|*'] }],
    });

    expect(text.split('\n')).toEqual(['pre', 'footer', 'T', '*|UNSUB|*']);
  });
});
