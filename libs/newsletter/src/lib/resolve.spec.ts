import type { NewsletterDocument } from './document';
import { articleIdsIn, imageIdsIn, resolveDocument } from './resolve';

const document: NewsletterDocument = {
  preheader: '',
  blocks: [
    { type: 'teaser', variant: 'big', articleId: 'a1' },
    { type: 'teaser', variant: 'short', articleId: 'a2' },
    { type: 'teaser', variant: 'short', articleId: 'a1' },
    { type: 'image', imageId: 'i1', alt: '' },
    { type: 'image', src: 'https://example.org/x.gif', alt: '' },
    { type: 'panel', title: 't', paragraphs: [], image: { imageId: 'i2' } },
  ],
};

describe('resolveDocument', () => {
  it('collects unique ids', () => {
    expect(articleIdsIn(document)).toEqual(['a1', 'a2']);
    expect(imageIdsIn(document)).toEqual(['i1', 'i2']);
  });

  it('fills teasers and images and reports what is missing', () => {
    const resolved = resolveDocument(
      document,
      new Map([
        [
          'a1',
          {
            id: 'a1',
            title: 'Title',
            lead: null,
            url: 'https://site/a/x',
            preTitle: 'Kicker',
            imageUrl: 'https://media/x.jpg',
          },
        ],
      ]),
      new Map([['i1', { id: 'i1', url: 'https://media/i1.jpg' }]])
    );

    expect(resolved.missingArticles).toEqual(['a2']);
    expect(resolved.missingImages).toEqual(['i2']);
    expect(resolved.document.blocks[0]).toMatchObject({
      teaser: {
        title: 'Title',
        kicker: 'Kicker',
        lead: '',
        imageUrl: 'https://media/x.jpg',
      },
    });
    expect(resolved.document.blocks[1]).toMatchObject({ teaser: undefined });
    expect(resolved.document.blocks[3]).toMatchObject({
      src: 'https://media/i1.jpg',
    });
    expect(resolved.document.blocks[4]).toMatchObject({
      src: 'https://example.org/x.gif',
    });
    expect(resolved.document.blocks[5]).toMatchObject({
      image: { imageId: 'i2', src: undefined },
    });
  });
});
