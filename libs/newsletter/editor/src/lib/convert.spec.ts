import type { NewsletterDocument } from '@wepublish/newsletter/email';
import { rememberArticles } from './articles';
import { fromPuckData, toBlock, toPuckData } from './convert';

const document: NewsletterDocument = {
  preheader: 'Vorschau',
  blocks: [
    {
      type: 'image',
      imageId: 'logo',
      alt: 'Logo',
      href: 'https://example.com/',
    },
    { type: 'teaser', variant: 'big', articleId: 'article-1' },
    {
      type: 'panel',
      title: 'Gewusst?',
      paragraphs: ['**fett**', '- eins'],
      imageId: 'cover',
      link: { label: 'Mehr', href: 'https://example.com/' },
    },
    {
      type: 'divider',
      condition: {
        kind: 'field',
        field: 'FNAME',
        operator: 'is',
        value: 'Bob',
      },
    },
    {
      type: 'footer',
      title: 'ee-news.ch',
      lines: ['Impressum'],
      legal: ['*|UNSUB|*'],
    },
  ],
};

describe('convert', () => {
  beforeAll(() => {
    rememberArticles([
      {
        id: 'article-1',
        title: 'Solar im Winter',
        lead: null,
        url: 'https://example.com/a/solar',
        preTitle: null,
        imageUrl: null,
        publishedAt: '2026-10-01T00:00:00.000Z',
        tags: [],
      },
    ]);
  });

  it('survives the round trip through Puck', () => {
    const { blocks, preheader } = fromPuckData(toPuckData(document));

    expect(preheader).toBe('Vorschau');
    expect(blocks).toEqual(
      document.blocks.map(block => expect.objectContaining(block))
    );
  });

  it('keeps the image id of image and panel blocks', () => {
    const data = toPuckData(document);

    expect(data.content[0].props).toMatchObject({ imageId: 'logo' });
    expect(data.content[2].props).toMatchObject({ imageId: 'cover' });
  });

  it('names a teaser by its headline, from the article cache', () => {
    expect(toPuckData(document).content[1].props).toMatchObject({
      article: { id: 'article-1', title: 'Solar im Winter' },
    });
  });

  it('gives an issue without a footer the blank one', () => {
    const { content } = toPuckData({ preheader: '', blocks: [] });

    expect(content.map(item => item.type)).toEqual(['footer']);
    expect(content[0].props).toMatchObject({ title: '', lines: '' });
  });

  it('drops a teaser that has no article yet', () => {
    expect(
      toBlock('teaser', { variant: 'big', article: undefined })
    ).toBeUndefined();
  });

  it('leaves an image block without an image empty rather than dropping it', () => {
    expect(toBlock('image', { imageId: '', alt: 'Logo' })).toMatchObject({
      type: 'image',
      imageId: undefined,
      alt: 'Logo',
    });
  });
});
