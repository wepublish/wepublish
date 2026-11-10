import {
  newIssueDocument,
  NewsletterDocument,
} from '@wepublish/newsletter/email';
import { DocumentError, parseDocument } from './parse';

const EVERY_BLOCK: NewsletterDocument = {
  kit: 'eenews',
  preheader: 'Vorschau',
  blocks: [
    { type: 'image', alt: 'Logo', href: 'https://example.com', gutter: 'none' },
    { type: 'meta', left: 'Newsletter', right: '13.8.2026' },
    { type: 'heading', text: 'Titel' },
    { type: 'text', gutter: 'intro', paragraphs: ['**Fett**', '- Liste'] },
    { type: 'button', label: 'Weiter', href: 'https://example.com' },
    { type: 'panel', title: 'Gewusst?', paragraphs: ['Text'] },
    { type: 'rubric', name: 'Solar' },
    { type: 'teaser', variant: 'big', articleId: 'article-1' },
    { type: 'divider' },
    { type: 'teaser', variant: 'short', articleId: 'article-2' },
    { type: 'footer', title: 'Fusszeile', lines: ['Redaktion'] },
  ],
};

const withBlocks = (...blocks: unknown[]) => ({ preheader: '', blocks });

describe('parseDocument', () => {
  it('accepts every block type', () => {
    const types = (document: { blocks: { type: string }[] }) =>
      document.blocks.map(block => block.type);

    expect(types(parseDocument(EVERY_BLOCK))).toEqual(types(EVERY_BLOCK));
  });

  it('accepts the document a new issue starts from', () => {
    expect(parseDocument(newIssueDocument('Ausgabe 1', 'eenews'))).toEqual(
      newIssueDocument('Ausgabe 1', 'eenews')
    );
  });

  it('refuses a javascript: link inside prose', () => {
    expect(() =>
      parseDocument(
        withBlocks({ type: 'text', paragraphs: ['[x](javascript:alert(1))'] })
      )
    ).toThrow(DocumentError);
  });

  it('lets merge tags through as link targets', () => {
    expect(
      parseDocument(
        withBlocks({ type: 'button', label: 'Abmelden', href: '*|UNSUB|*' })
      ).blocks[0]
    ).toMatchObject({ href: '*|UNSUB|*' });
  });

  it('refuses an unknown block type', () => {
    expect(() => parseDocument(withBlocks({ type: 'video' }))).toThrow(
      'ist unbekannt ("video")'
    );
  });

  it('keeps an image block without an image', () => {
    expect(
      parseDocument(withBlocks({ type: 'image', imageId: '', alt: 'Logo' }))
        .blocks[0]
    ).toEqual({ type: 'image', imageId: undefined, alt: 'Logo' });
  });

  it('stores the image id and never a url', () => {
    expect(
      parseDocument(
        withBlocks({
          type: 'panel',
          title: 'Gewusst?',
          paragraphs: [],
          imageId: 'image-1',
          imageUrl: 'https://evil.example.com',
        })
      ).blocks[0]
    ).toEqual({
      type: 'panel',
      title: 'Gewusst?',
      paragraphs: [],
      imageId: 'image-1',
    });
  });

  it('drops a half-chosen condition', () => {
    expect(
      parseDocument(
        withBlocks({
          type: 'divider',
          condition: { field: 'FNAME', operator: 'is', value: '' },
        })
      ).blocks[0].condition
    ).toBeUndefined();
  });

  it('refuses a delimiter inside a condition value', () => {
    expect(() =>
      parseDocument(
        withBlocks({
          type: 'divider',
          condition: { field: 'FNAME', operator: 'is', value: 'a|b' },
        })
      )
    ).toThrow(DocumentError);
  });

  it('refuses a condition value renderToStaticMarkup would escape', () => {
    expect(() =>
      parseDocument(
        withBlocks({
          type: 'divider',
          condition: { field: 'FNAME', operator: 'is', value: 'A & B' },
        })
      )
    ).toThrow(DocumentError);
  });

  it('refuses an interest name renderToStaticMarkup would escape', () => {
    expect(() =>
      parseDocument(
        withBlocks({
          type: 'divider',
          condition: {
            kind: 'interest',
            field: 'Marketing & Sales',
            operator: 'is',
            value: 'VIP',
          },
        })
      )
    ).toThrow(DocumentError);
  });

  it('refuses a conditional footer', () => {
    expect(() =>
      parseDocument(
        withBlocks({
          type: 'footer',
          title: '',
          lines: [],
          condition: { field: 'FNAME', operator: 'is', value: 'Bob' },
        })
      )
    ).toThrow('ist in der Fusszeile nicht möglich');
  });

  it('refuses a second footer', () => {
    const footer = { type: 'footer', title: '', lines: [] };

    expect(() => parseDocument(withBlocks(footer, footer))).toThrow(
      'darf höchstens eine Fusszeile enthalten'
    );
  });
});

describe('kits', () => {
  it('reads a document stored before kits existed as an eenews issue', () => {
    expect(parseDocument(withBlocks({ type: 'divider' })).kit).toBe('eenews');
  });

  it('keeps the kit a stored document names', () => {
    expect(
      parseDocument({ kit: 'bajour', ...withBlocks({ type: 'divider' }) }).kit
    ).toBe('bajour');
  });

  it('puts a document that names no kit into the one it is asked for', () => {
    expect(parseDocument(withBlocks({ type: 'divider' }), 'bajour').kit).toBe(
      'bajour'
    );
  });

  it('refuses a document that claims another kit than its issue is in', () => {
    expect(() =>
      parseDocument({ kit: 'eenews', ...withBlocks() }, 'bajour')
    ).toThrow('lässt sich nicht wechseln');
  });

  it('refuses a kit it does not know', () => {
    expect(() => parseDocument({ kit: 'tsri', ...withBlocks() })).toThrow(
      'ist unbekannt ("tsri")'
    );
  });

  it('refuses a block the kit does not offer', () => {
    expect(() =>
      parseDocument(withBlocks({ type: 'rubric', name: 'Solar' }), 'bajour')
    ).toThrow('gibt es in der Vorlage «bajour» nicht');
  });

  it('refuses an Einzug the kit does not offer', () => {
    expect(() =>
      parseDocument(withBlocks({ type: 'divider', gutter: 'intro' }), 'bajour')
    ).toThrow('muss "article" oder "none" sein');
  });

  it('still offers eenews all three Einzüge', () => {
    expect(
      parseDocument(withBlocks({ type: 'divider', gutter: 'intro' }), 'eenews')
        .blocks[0]
    ).toMatchObject({ gutter: 'intro' });
  });
});
