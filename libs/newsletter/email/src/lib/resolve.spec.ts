import type { NewsletterDocument } from './document';
import {
  articleIdsIn,
  imagesIn,
  resolveImages,
  resolveTeasers,
  teaserFromArticle,
} from './resolve';
import { theme } from './theme';

const article = {
  id: 'article-1',
  title: 'Solar im Winter',
  lead: 'Lead',
  url: 'https://example.com/a/solar',
  preTitle: 'SUPSI',
  imageUrl: 'https://media.example.com/image-1?format=jpeg',
};

const document: NewsletterDocument = {
  preheader: '',
  blocks: [
    { type: 'teaser', variant: 'big', articleId: 'article-1' },
    { type: 'teaser', variant: 'short', articleId: 'gone' },
    { type: 'image', imageId: 'logo', alt: 'Logo' },
    { type: 'image', alt: 'Nothing picked yet' },
    {
      type: 'panel',
      title: 'Gewusst?',
      paragraphs: [],
      imageId: 'logo',
    },
    { type: 'image', imageId: 'deleted', alt: '' },
  ],
};

describe('teaserFromArticle', () => {
  it('maps the kicker and keeps the image url as it is', () => {
    expect(teaserFromArticle(article)).toEqual({
      kicker: 'SUPSI',
      title: 'Solar im Winter',
      lead: 'Lead',
      url: 'https://example.com/a/solar',
      imageUrl: 'https://media.example.com/image-1?format=jpeg',
    });
  });
});

describe('resolveTeasers', () => {
  it('fills teasers and reports the articles it could not find', () => {
    const resolved = resolveTeasers(document, new Map([[article.id, article]]));

    expect(resolved.missing).toEqual(['gone']);
    expect(resolved.document.blocks[0]).toMatchObject({
      teaser: { title: 'Solar im Winter' },
    });
    expect(resolved.document.blocks[1]).toMatchObject({ teaser: undefined });
  });

  it('lists every article in document order', () => {
    expect(articleIdsIn(document)).toEqual(['article-1', 'gone']);
  });
});

describe('images', () => {
  it('lists every image once, at the widest size it is drawn', () => {
    expect(imagesIn(document)).toEqual([
      { id: 'logo', renderedWidth: theme.contentWidth },
      { id: 'deleted', renderedWidth: theme.contentWidth },
    ]);
  });

  it('points image and panel blocks at the url of their image', () => {
    const { blocks } = resolveImages(
      document,
      new Map([['logo', 'https://media.example.com/logo']])
    );

    expect(blocks[2]).toMatchObject({ src: 'https://media.example.com/logo' });
    expect(blocks[3]).not.toHaveProperty('src');
    expect(blocks[4]).toMatchObject({
      imageUrl: 'https://media.example.com/logo',
    });
    expect(blocks[5]).toMatchObject({ src: undefined });
  });
});
