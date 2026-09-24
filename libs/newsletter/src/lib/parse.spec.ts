import { DocumentError, parseDocument } from './parse';

const footer = { type: 'footer', title: 'Impressum', lines: [] };

describe('parseDocument', () => {
  it('accepts a minimal valid document and normalises optional fields', () => {
    const document = parseDocument({
      preheader: 'Hello',
      blocks: [
        { type: 'heading', text: 'Title' },
        {
          type: 'text',
          paragraphs: ['**bold** and [link](https://example.org)'],
        },
        { type: 'image', imageId: 'abc-123', alt: '', href: '', caption: null },
        { type: 'teaser', variant: 'big', articleId: 'a1' },
        footer,
      ],
    });

    expect(document.preheader).toBe('Hello');
    expect(document.blocks[2]).toEqual({
      type: 'image',
      imageId: 'abc-123',
      alt: '',
      href: undefined,
      caption: undefined,
      gutter: undefined,
      condition: undefined,
    });
  });

  it('refuses javascript: links in block fields and inline prose', () => {
    expect(() =>
      parseDocument({
        blocks: [{ type: 'button', label: 'Go', href: 'javascript:alert(1)' }],
      })
    ).toThrow(DocumentError);

    expect(() =>
      parseDocument({
        blocks: [{ type: 'text', paragraphs: ['[x](javascript:alert(1))'] }],
      })
    ).toThrow(/link "x"/);
  });

  it('lets merge tags through as link targets', () => {
    const document = parseDocument({
      blocks: [{ type: 'button', label: 'Unsubscribe', href: '*|UNSUB|*' }],
    });

    expect(document.blocks[0]).toMatchObject({ href: '*|UNSUB|*' });
  });

  it('refuses unknown block types and a second footer', () => {
    expect(() => parseDocument({ blocks: [{ type: 'video' }] })).toThrow(
      /unknown/
    );
    expect(() => parseDocument({ blocks: [footer, footer] })).toThrow(
      /at most one footer/
    );
  });

  it('drops an incomplete condition and refuses a malformed one', () => {
    const incomplete = parseDocument({
      blocks: [{ type: 'divider', condition: { field: 'FNAME', value: '' } }],
    });

    expect(incomplete.blocks[0].condition).toBeUndefined();

    expect(() =>
      parseDocument({
        blocks: [
          { type: 'divider', condition: { field: 'FNAME', value: 'a|b' } },
        ],
      })
    ).toThrow(/must not contain/);

    expect(() =>
      parseDocument({
        blocks: [
          {
            type: 'divider',
            condition: { kind: 'interest', field: 'A:B', value: 'x' },
          },
        ],
      })
    ).toThrow(/group category/);
  });

  it('refuses a conditional footer', () => {
    expect(() =>
      parseDocument({
        blocks: [{ ...footer, condition: { field: 'FNAME', value: 'Bob' } }],
      })
    ).toThrow(/footer/);
  });

  it('keeps an explicitly empty legal notice distinct from an absent one', () => {
    const [absent, empty] = parseDocument({
      blocks: [footer, { type: 'heading', text: 'x' }],
    }).blocks;
    const cleared = parseDocument({
      blocks: [{ ...footer, legal: [] }],
    }).blocks[0];

    expect(absent).toMatchObject({ type: 'footer', legal: undefined });
    expect(empty.type).toBe('heading');
    expect(cleared).toMatchObject({ type: 'footer', legal: [] });
  });

  it('accepts a panel with an external image and a link', () => {
    const document = parseDocument({
      blocks: [
        {
          type: 'panel',
          title: 'Gewusst?',
          paragraphs: ['Text'],
          image: { src: 'https://example.org/a.png' },
          link: { label: 'More', href: 'https://example.org' },
        },
      ],
    });

    expect(document.blocks[0]).toMatchObject({
      type: 'panel',
      image: { src: 'https://example.org/a.png' },
      link: { label: 'More', href: 'https://example.org/' },
    });
  });
});
