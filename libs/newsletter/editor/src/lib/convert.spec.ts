import type { NewsletterDocument } from '@wepublish/newsletter';
import { DEFAULT_GUTTER } from '@wepublish/newsletter';
import { rememberArticles } from './articles';
import { fromPuckData, toPuckData } from './convert';

const document: NewsletterDocument = {
  preheader: 'Preview',
  blocks: [
    { type: 'meta', left: 'Newsletter', right: '1.1.2026' },
    {
      type: 'text',
      gutter: 'intro',
      paragraphs: ['**Hallo**', '- eins', '- zwei'],
    },
    { type: 'teaser', variant: 'big', articleId: 'a1' },
    { type: 'image', imageId: 'i1', alt: 'Logo', href: 'https://example.org' },
    {
      type: 'panel',
      title: 'Gewusst?',
      paragraphs: ['Text'],
      image: { src: 'https://example.org/x.png' },
      link: { label: 'Mehr', href: 'https://example.org/more' },
      condition: {
        kind: 'field',
        field: 'FNAME',
        operator: 'not',
        value: 'Bob',
      },
    },
    { type: 'footer', title: 'ee', lines: ['Impressum'], legal: ['*|UNSUB|*'] },
  ],
};

describe('convert', () => {
  beforeAll(() => {
    rememberArticles([
      {
        id: 'a1',
        title: 'Headline',
        lead: null,
        url: 'https://site/a',
        preTitle: null,
        imageUrl: null,
        publishedAt: null,
        tags: [],
      },
    ]);
  });

  it('round-trips a document through Puck data, writing default gutters out', () => {
    const once = fromPuckData(toPuckData(document));

    expect(once).toEqual({
      ...document,
      blocks: document.blocks.map(block => ({
        ...block,
        gutter: block.gutter ?? DEFAULT_GUTTER[block.type],
      })),
    });
    expect(fromPuckData(toPuckData(once))).toEqual(once);
  });

  it('names the teaser after its article in the picker', () => {
    const data = toPuckData(document);

    expect(data.content[2].props).toMatchObject({
      article: { id: 'a1', title: 'Headline' },
    });
  });

  it('appends a footer to a document that has none', () => {
    const data = toPuckData({ preheader: '', blocks: [{ type: 'divider' }] });

    expect(data.content.map(item => item.type)).toEqual(['divider', 'footer']);
  });

  it('drops a teaser without an article and a half-filled condition', () => {
    const converted = fromPuckData({
      root: { props: { preheader: '' } },
      content: [
        { type: 'teaser', props: { id: 't', variant: 'big', article: {} } },
        {
          type: 'divider',
          props: {
            id: 'd',
            gutter: 'article',
            condition: {
              kind: 'field',
              field: 'FNAME',
              operator: 'is',
              value: '',
            },
          },
        },
      ],
    });

    expect(converted.blocks).toEqual([
      { type: 'divider', gutter: 'article', condition: undefined },
    ]);
  });

  it('always writes the footer legal notice out', () => {
    const converted = fromPuckData(
      toPuckData({
        preheader: '',
        blocks: [{ type: 'footer', title: '', lines: [] }],
      })
    );

    expect(converted.blocks[0]).toMatchObject({
      type: 'footer',
      legal: expect.arrayContaining(['[Im Browser ansehen](*|ARCHIVE|*)']),
    });
  });
});
