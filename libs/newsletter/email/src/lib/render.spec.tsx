import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderBlock } from './blocks';
import { newIssueDocument } from './new-issue';
import type { NewsletterDocument } from './document';
import { renderParagraphs } from './inline';
import { eenewsKit, eenewsTheme } from './kits/eenews';
import { NewsletterKitProvider } from './kit';
import { conditionTags, missingRequiredFooterTags } from './merge-tags';
import { renderNewsletter } from './render';
import { documentText, htmlBytes, newsletterReport } from './report';

const draw = (paragraphs: string[]) =>
  renderToStaticMarkup(
    <>{renderParagraphs(paragraphs, {}, { theme: eenewsTheme })}</>
  );

/** A single block, as the canvas draws it: inside its kit. */
const drawBlock = (block: ReactNode) =>
  renderToStaticMarkup(
    <NewsletterKitProvider kit={eenewsKit}>{block}</NewsletterKitProvider>
  );

describe('inline markup', () => {
  it('leaves two adjacent merge tags alone instead of reading a bold run between them', () => {
    const html = draw(['*|IFNOT:ARCHIVE_PAGE|**|LIST:ADDRESSLINE|**|END:IF|*']);

    expect(html).toContain(
      '*|IFNOT:ARCHIVE_PAGE|**|LIST:ADDRESSLINE|**|END:IF|*'
    );
    expect(html).not.toContain('<strong>');
  });

  it('draws bold and underlined links', () => {
    const html = draw(['**fett** und [Link](https://example.com)']);

    expect(html).toContain('<strong>fett</strong>');
    expect(html).toMatch(
      /<a href="https:\/\/example.com"[^>]*text-decoration:underline/
    );
  });

  it('folds consecutive bullet lines into one list', () => {
    const html = draw(['Intro', '- eins', '- zwei', 'Outro']);

    expect(html.match(/<ul/g)).toHaveLength(1);
    expect(html.match(/<li/g)).toHaveLength(2);
  });

  it('writes both margins of every paragraph', () => {
    const html = draw(['eins', 'zwei']);

    expect(html.match(/margin-bottom:0/g)).toHaveLength(2);
  });
});

describe('conditionTags', () => {
  it('wraps a merge field in IF', () => {
    expect(
      conditionTags({ field: 'FNAME', operator: 'not', value: 'Bob' })
    ).toEqual({ open: '*|IF:FNAME!=Bob|*', close: '*|END:IF|*' });
  });

  it('puts a negated group into the ELSE branch', () => {
    expect(
      conditionTags({
        kind: 'interest',
        field: 'Kundschaft',
        operator: 'not',
        value: 'Stammkundschaft',
      })
    ).toEqual({
      open: '*|INTERESTED:Kundschaft:Stammkundschaft|**|ELSE:|*',
      close: '*|END:INTERESTED|*',
    });
  });

  it('is no condition while the value is still empty', () => {
    expect(
      conditionTags({ field: 'FNAME', operator: 'is', value: '' })
    ).toBeUndefined();
  });

  it('wraps the whole block in the tags', () => {
    const html = drawBlock(
      renderBlock(
        {
          type: 'divider',
          condition: { field: 'FNAME', operator: 'is', value: 'Bob' },
        },
        0
      )
    );

    expect(html.startsWith('*|IF:FNAME=Bob|*')).toBe(true);
    expect(html.endsWith('*|END:IF|*')).toBe(true);
  });
});

describe('image block', () => {
  it('draws nothing until an image is picked', () => {
    expect(
      drawBlock(renderBlock({ type: 'image', imageId: 'logo', alt: 'Logo' }, 0))
    ).toBe('');
  });

  it('sizes the image by attribute for Outlook', () => {
    const html = drawBlock(
      renderBlock(
        {
          type: 'image',
          src: 'https://media.example.com/logo',
          alt: 'Logo',
          gutter: 'none',
        },
        0
      )
    );

    expect(html).toContain('width="660"');
  });
});

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

/**
 * Every block in every state it can render in, resolved the way the server
 * resolves it: both teaser variants with their article, a panel with and
 * without its image, a linked and captioned image, every Einzug and a condition.
 */
const EENEWS_ISSUE: NewsletterDocument = {
  kit: 'eenews',
  preheader: 'Vorschau',
  blocks: [
    {
      type: 'image',
      src: 'https://media.example.com/logo',
      alt: 'Logo',
      href: 'https://example.com',
      gutter: 'none',
    },
    { type: 'meta', left: 'Newsletter', right: '13.8.2026' },
    { type: 'heading', text: 'Titel der Ausgabe' },
    {
      type: 'text',
      gutter: 'intro',
      paragraphs: [
        '**Fett** und [Link](https://example.com)',
        '- eins',
        '- zwei',
      ],
    },
    {
      type: 'button',
      label: 'Jetzt unterstützen',
      href: 'https://example.com',
    },
    {
      type: 'panel',
      title: 'Gewusst?',
      paragraphs: ['Text'],
      link: { label: 'Mehr', href: 'https://example.com' },
    },
    {
      type: 'panel',
      title: 'Mit Bild',
      paragraphs: ['Text'],
      imageUrl: 'https://media.example.com/cover',
    },
    { type: 'rubric', name: 'Solar' },
    {
      type: 'teaser',
      variant: 'big',
      articleId: 'article-1',
      teaser: {
        kicker: 'Institut',
        title: 'Grosser Teaser',
        lead: 'Lead',
        url: 'https://example.com/a/1',
        imageUrl: 'https://media.example.com/a1',
      },
    },
    { type: 'divider', gutter: 'none' },
    {
      type: 'teaser',
      variant: 'short',
      articleId: 'article-2',
      teaser: {
        title: 'Kurzer Teaser',
        lead: 'Lead',
        url: 'https://example.com/a/2',
      },
      condition: { field: 'FNAME', operator: 'is', value: 'Bob' },
    },
    { type: 'teaser', variant: 'short', articleId: 'gone' },
    {
      type: 'image',
      src: 'https://media.example.com/photo',
      alt: 'Foto',
      caption: 'Bildlegende',
    },
    {
      type: 'footer',
      title: 'ee-news.ch',
      lines: ['Redaktion [Kontakt](https://example.com)'],
    },
  ],
};

describe('eenews layout', () => {
  it('renders every block exactly as before medium kits existed', async () => {
    await expect(await renderNewsletter(EENEWS_ISSUE)).toMatchFileSnapshot(
      './__snapshots__/eenews-issue.html'
    );
  });
});

describe('renderNewsletter', () => {
  it('never pretty-prints end tags', async () => {
    expect(await renderNewsletter(EVERY_BLOCK)).not.toMatch(/<\/\w+\n/);
  });

  it('gives a new issue the footer tags Mailchimp requires', async () => {
    expect(
      missingRequiredFooterTags(
        await renderNewsletter(newIssueDocument('Ausgabe 1', 'eenews'))
      )
    ).toEqual([]);
  });

  it('starts with the XHTML doctype email clients expect', async () => {
    expect(await renderNewsletter(EVERY_BLOCK)).toMatch(
      /^<!DOCTYPE html PUBLIC "-\/\/W3C\/\/DTD XHTML 1.0 Transitional\/\/EN"/
    );
  });

  it('carries nothing only a browser could use: image preloads, React stream markers', async () => {
    const html = await renderNewsletter({
      kit: 'eenews',
      preheader: '',
      blocks: [
        {
          type: 'image',
          src: 'https://media.example.com/logo',
          alt: 'Logo',
          gutter: 'none',
        },
      ],
    });

    expect(html).toContain('<img');
    expect(html).not.toContain('rel="preload"');
    expect(html).not.toMatch(/<!--(\$|\/\$|html|head|body)-->/);
  });
});

describe('report', () => {
  it('counts bytes, not characters', () => {
    expect(htmlBytes('ä')).toBe(2);
  });

  it('names the missing footer tags and articles', () => {
    expect(newsletterReport('<p></p>', ['article-1'])).toEqual({
      bytes: 7,
      missingFooter: [
        'ein Abmeldelink (*|UNSUB|*)',
        'die Postadresse (*|HTML:LIST_ADDRESS_HTML|* oder *|LIST:ADDRESS|* oder *|LIST:ADDRESSLINE|*)',
      ],
      missingArticles: ['article-1'],
    });
  });

  it('collects every string of the document', () => {
    const document: NewsletterDocument = {
      kit: 'eenews',
      preheader: 'Vorschau',
      blocks: [
        { type: 'footer', title: 'ee', lines: [], legal: ['*|UNSUB|*'] },
      ],
    };

    expect(documentText(document).split('\n')).toEqual(
      expect.arrayContaining(['Vorschau', 'ee', '*|UNSUB|*'])
    );
  });
});
