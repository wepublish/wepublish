import {
  newIssueDocument,
  NewsletterDocument,
} from '@wepublish/newsletter/email';
import { DocumentError, parseDocument } from './parse';

const EVERY_BLOCK: NewsletterDocument = {
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
    expect(parseDocument(newIssueDocument('Ausgabe 1'))).toEqual(
      newIssueDocument('Ausgabe 1')
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
