import { PuckEditorDocumentKind } from '../document-kind/document-kind';
import {
  articleRootSchema,
  ArticleRootProps,
  DocumentRootProps,
  pageRootSchema,
  PageRootProps,
  rootFieldAi,
  rootSchemas,
} from './root.field';

describe('rootFieldAi', () => {
  it('derives the AI params of a root field from the root schema', () => {
    const ai = rootFieldAi(pageRootSchema, 'properties');

    expect(ai.instructions).toBe(pageRootSchema.shape.properties.description);
    expect(ai.schema).toMatchObject({ type: 'array' });
  });

  it('describes a field for the kind of document it belongs to', () => {
    expect(rootFieldAi(pageRootSchema, 'title').instructions).toBe(
      'Title of the page.'
    );
    expect(rootFieldAi(articleRootSchema, 'title').instructions).toBe(
      'Title of the article.'
    );
  });

  it('lets the AI pick existing authors only', () => {
    expect(rootFieldAi(articleRootSchema, 'authorIds')).toMatchObject({
      instructions: expect.stringContaining('never invent'),
      schema: { type: 'array', items: { type: 'string' } },
    });
  });
});

describe('pageRootSchema', () => {
  it('only allows lowercase dashed slugs', () => {
    expect(pageRootSchema.shape.slug.safeParse('about-us').success).toBe(true);
    expect(pageRootSchema.shape.slug.safeParse('About Us').success).toBe(false);
  });

  it('has the navigation and footer switches of a page', () => {
    expect(Object.keys(pageRootSchema.shape)).toEqual([
      'title',
      'lead',
      'imageId',
      'slug',
      'seoTitle',
      'seoDescription',
      'socialMediaTitle',
      'socialMediaDescription',
      'socialMediaImageId',
      'properties',
      'tags',
      'hidden',
      'showNavigation',
      'showFooter',
    ]);
  });
});

describe('articleRootSchema', () => {
  it('has the byline and publication settings of an article', () => {
    expect(Object.keys(articleRootSchema.shape).sort()).toEqual(
      [
        'preTitle',
        'title',
        'lead',
        'imageId',
        'slug',
        'canonicalUrl',
        'authorIds',
        'hideAuthor',
        'tags',
        'paywallId',
        'breaking',
        'hidden',
        'disableComments',
        'shared',
        'seoTitle',
        'seoDescription',
        'socialMediaTitle',
        'socialMediaDescription',
        'socialMediaImageId',
        'socialMediaAuthorIds',
        'properties',
      ].sort()
    );
  });

  it('accepts the metadata of an article', () => {
    expect(
      articleRootSchema.partial().parse({
        preTitle: 'Breaking',
        title: 'Title',
        authorIds: ['author-1', 'author-2'],
        paywallId: 'paywall-1',
        breaking: true,
        shared: false,
      })
    ).toEqual({
      preTitle: 'Breaking',
      title: 'Title',
      authorIds: ['author-1', 'author-2'],
      paywallId: 'paywall-1',
      breaking: true,
      shared: false,
    });
  });
});

describe('rootSchemas', () => {
  it('has a schema for every document kind', () => {
    expect(rootSchemas).toEqual({
      page: pageRootSchema,
      article: articleRootSchema,
    });
    expectTypeOf<
      keyof typeof rootSchemas
    >().toEqualTypeOf<PuckEditorDocumentKind>();
  });

  it('keeps page-only props out of articles', () => {
    expectTypeOf<PageRootProps>().toHaveProperty('showFooter');
    expectTypeOf<ArticleRootProps>().not.toHaveProperty('showFooter');
    expectTypeOf<PageRootProps>().not.toHaveProperty('authorIds');
    expectTypeOf<DocumentRootProps>().toHaveProperty('seoTitle');
    expectTypeOf<DocumentRootProps>().not.toHaveProperty('preTitle');
  });
});
