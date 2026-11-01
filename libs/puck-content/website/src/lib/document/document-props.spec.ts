import {
  ArticleRootProps,
  DocumentRootProps,
  PageRootProps,
  PuckDocumentKind,
  puckDocumentKinds,
} from './document-props';

describe('puckDocumentKinds', () => {
  it('lists every document kind once', () => {
    expect(puckDocumentKinds).toEqual(['page', 'article']);
    expectTypeOf<
      (typeof puckDocumentKinds)[number]
    >().toEqualTypeOf<PuckDocumentKind>();
  });
});

describe('root props', () => {
  it('shares the document props between pages and articles', () => {
    expectTypeOf<keyof DocumentRootProps>().toEqualTypeOf<
      keyof PageRootProps & keyof ArticleRootProps
    >();
    expectTypeOf<PageRootProps>().toHaveProperty('showFooter');
    expectTypeOf<ArticleRootProps>().not.toHaveProperty('showFooter');
    expectTypeOf<ArticleRootProps>().toHaveProperty('authorIds');
  });
});
