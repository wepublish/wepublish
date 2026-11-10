import { renderToStaticMarkup } from 'react-dom/server';
import { renderBlock } from './blocks';
import type { NewsletterDocument } from './document';
import { getKit, isKitId, KIT_IDS, NewsletterKitProvider } from './kit';
import { missingRequiredFooterTags } from './merge-tags';
import { newIssueDocument } from './new-issue';
import { renderNewsletter } from './render';
import { imagesIn } from './resolve';

/** The shared blocks in the bajour theme, as a Basel Briefing would use them. */
const BRIEFING: NewsletterDocument = {
  kit: 'bajour',
  preheader: 'Vorschau',
  blocks: [
    { type: 'meta', left: '06.11.26', right: '' },
    {
      type: 'image',
      src: 'https://media.example.com/masthead',
      alt: 'Basel Briefing',
      gutter: 'none',
    },
    { type: 'heading', text: 'Autofreier Bankverein – und dann?' },
    {
      type: 'image',
      src: 'https://media.example.com/photo',
      alt: 'Aeschenplatz',
      caption: 'Velostreifen am Aeschenplatz',
    },
    { type: 'text', paragraphs: ['Mehr [im Artikel](https://bajour.ch/a/x)'] },
    { type: 'button', label: 'hier! 📝', href: 'https://bajour.ch/a/frage' },
    { type: 'divider' },
    {
      type: 'footer',
      title: 'Basel Briefing - der tägliche Newsletter mit ❤️ von Bajour.',
      lines: ['[anmelden](https://bajour.ch/newsletter)'],
    },
  ],
};

/**
 * The inline style of the element that contains `marker`: the nearest one
 * before it, or the nearest `<tag` when the styling sits further out than the
 * innermost element.
 */
const styleAround = (html: string, marker: string, tag?: string) => {
  const at = html.indexOf(marker);
  const element = tag ? html.lastIndexOf(`<${tag} `, at) : 0;
  const open =
    tag ? html.indexOf('style="', element) : html.lastIndexOf('style="', at);

  return html.slice(open, html.indexOf('"', open + 7));
};

describe('kits', () => {
  it('knows eenews and bajour', () => {
    expect(KIT_IDS).toEqual(['eenews', 'bajour']);
    expect(isKitId('bajour')).toBe(true);
    expect(isKitId('tsri')).toBe(false);
  });

  it('gives eenews every block and bajour only the shared ones', () => {
    expect(getKit('eenews').blocks).toEqual(
      expect.arrayContaining(['rubric', 'teaser', 'panel'])
    );
    expect([...getKit('bajour').blocks].sort()).toEqual(
      ['button', 'divider', 'footer', 'heading', 'image', 'meta', 'text'].sort()
    );
  });

  it('offers bajour no intro Einzug, and every bajour default is one it offers', () => {
    const bajour = getKit('bajour');

    expect(bajour.gutters).toEqual(['article', 'none']);

    for (const type of bajour.blocks) {
      expect(bajour.gutters).toContain(bajour.defaultGutter[type]);
    }
  });

  it('starts a new issue in the kit it is asked for', () => {
    expect(newIssueDocument('Ausgabe 1', 'bajour').kit).toBe('bajour');
    expect(newIssueDocument('Ausgabe 1', 'eenews').kit).toBe('eenews');
  });

  it('refuses to draw a block outside a kit rather than guessing one', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() =>
      renderToStaticMarkup(renderBlock({ type: 'divider' }, 0))
    ).toThrow(/NewsletterKitProvider/);
  });

  it('draws a block in the kit it is given', () => {
    const html = renderToStaticMarkup(
      <NewsletterKitProvider kit={getKit('bajour')}>
        {renderBlock({ type: 'divider' }, 0)}
      </NewsletterKitProvider>
    );

    expect(html).toContain('border-top:2px solid #EAEAEA');
  });
});

describe('the bajour layout', () => {
  let html: string;

  beforeAll(async () => {
    html = await renderNewsletter(BRIEFING);
  });

  it('is a 600px column on the template’s grey page', () => {
    expect(html).toContain('width="600"');
    expect(html).toContain('background-color:#FAFAFA');
  });

  it('sets the text in Georgia at 20px, links in bajour pink', () => {
    const text = styleAround(html, 'Mehr ');

    expect(text).toContain('font-family:Georgia');
    expect(text).toContain('font-size:20px');
    expect(text).toContain('color:#202020');
    expect(styleAround(html, '>im Artikel<')).toContain('color:#FF0D63');
  });

  it('draws section headings in the text colour, not the accent', () => {
    const heading = styleAround(html, 'Autofreier Bankverein');

    expect(heading).toContain('font-size:20px');
    expect(heading).toContain('font-weight:700');
    expect(heading).toContain('color:#202020');
  });

  it('spans an image across the 18px gutters, with a centred Arial caption', () => {
    expect(html).toContain('width="564"');
    expect(html).toContain('width="600"');

    const caption = styleAround(html, 'Velostreifen am Aeschenplatz');

    expect(caption).toContain('font-family:Arial');
    expect(caption).toContain('font-size:14px');
    expect(caption).toContain('text-align:center');
  });

  it('centres a pink button set in Arial', () => {
    const button = styleAround(html, 'hier! 📝', 'a');

    expect(button).toContain('background-color:#FF0D63');
    expect(button).toContain('font-family:Arial');
    expect(button).toContain('padding:18px');
    expect(styleAround(html, 'hier! 📝', 'td')).toContain('text-align:center');
  });

  it('rules sections off with the template’s 2px grey line', () => {
    expect(html).toContain('border-top:2px solid #EAEAEA');
  });

  it('closes on the black banner, the legal notice small and grey below it', () => {
    const title = styleAround(html, 'Basel Briefing - der tägliche');

    expect(title).toContain('background-color:#000000');
    expect(title).toContain('color:#FFFFFF');

    const legal = styleAround(html, 'Im Browser ansehen', 'p');

    expect(legal).toContain('font-size:10px');
    expect(legal).toContain('color:#656565');
    expect(missingRequiredFooterTags(html)).toEqual([]);
  });

  it('asks for images as wide as the bajour column draws them', () => {
    expect(
      imagesIn({
        kit: 'bajour',
        preheader: '',
        blocks: [{ type: 'image', imageId: 'photo', alt: '' }],
      })
    ).toEqual([{ id: 'photo', renderedWidth: 600 }]);
  });
});
