import {
  mockArticle,
  mockArticleRevision,
  mockArticleRevisionAuthor,
  mockAuthor,
  mockImage,
  mockPage,
  mockPageRevision,
  mockPaywall,
  mockTag,
} from '@wepublish/mocks/website';
import { PuckArticleQuery, PuckPageQuery } from '@wepublish/website/api';

import {
  articleRootProps,
  ArticleRootProps,
  DocumentRootProps,
  PageRootProps,
  pageRootProps,
  PuckDocumentKind,
  puckDocumentKinds,
} from './document-props';

type PuckPage = NonNullable<PuckPageQuery['page']>;
type PuckArticle = NonNullable<PuckArticleQuery['article']>;

const puckPage = ({
  latest,
  ...page
}: ReturnType<typeof mockPage>): PuckPage => ({
  ...page,
  latest: {
    ...latest,
    seoTitle: 'Search title',
    seoDescription: 'Search lead',
    puckBlocks: [],
    puckRegistry: null,
  },
});

const puckArticle = ({
  latest,
  ...article
}: ReturnType<typeof mockArticle>): PuckArticle => ({
  ...article,
  latest: { ...latest, puckBlocks: [], puckRegistry: null },
});

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

describe('pageRootProps', () => {
  const image = mockImage();
  const socialMediaImage = mockImage();
  const tag = mockTag();
  const page = puckPage(
    mockPage({
      slug: 'about-us',
      hidden: true,
      hideHeader: true,
      hideFooter: false,
      tags: [tag],
      latest: mockPageRevision({
        title: 'About us',
        description: 'Who we are',
        image,
        socialMediaImage,
        socialMediaTitle: 'Share title',
        socialMediaDescription: 'Share lead',
        properties: [{ __typename: 'Property', key: 'tracking', value: 'off' }],
      }),
    })
  );

  it('reads the root props of a page from the revision and the page', () => {
    expect(pageRootProps(page)).toEqual({
      title: 'About us',
      lead: 'Who we are',
      imageId: image.id,
      slug: 'about-us',
      tags: [tag.id],
      hidden: true,
      showNavigation: false,
      showFooter: true,
      seoTitle: 'Search title',
      seoDescription: 'Search lead',
      socialMediaTitle: 'Share title',
      socialMediaDescription: 'Share lead',
      socialMediaImageId: socialMediaImage.id,
      properties: [{ key: 'tracking', value: 'off', public: true }],
    });
  });

  it('leaves out what the page does not set', () => {
    expect(
      pageRootProps({
        ...page,
        slug: null,
        latest: {
          ...page.latest,
          title: null,
          description: null,
          image: null,
          seoTitle: null,
          seoDescription: null,
          socialMediaTitle: null,
          socialMediaDescription: null,
          socialMediaImage: null,
        },
      })
    ).toEqual({
      tags: [tag.id],
      hidden: true,
      showNavigation: false,
      showFooter: true,
      properties: [{ key: 'tracking', value: 'off', public: true }],
    });
  });
});

describe('articleRootProps', () => {
  const image = mockImage();
  const socialMediaImage = mockImage();
  const author = mockAuthor();
  const tag = mockTag();
  const paywall = mockPaywall();
  const article = puckArticle(
    mockArticle({
      slug: 'breaking-news',
      paywall,
      hidden: false,
      disableComments: true,
      tags: [tag],
      latest: mockArticleRevision({
        preTitle: 'Kicker',
        title: 'Breaking news',
        lead: 'It happened',
        image,
        socialMediaImage,
        canonicalUrl: 'https://example.com/original',
        authors: [mockArticleRevisionAuthor({ author })],
        hideAuthor: true,
        breaking: true,
        seoTitle: 'Search title',
        seoDescription: 'Search lead',
        socialMediaTitle: 'Share title',
        socialMediaDescription: 'Share lead',
        properties: [],
      }),
    })
  );

  it('reads the root props of an article from the revision and the article', () => {
    expect(articleRootProps(article)).toEqual({
      preTitle: 'Kicker',
      title: 'Breaking news',
      lead: 'It happened',
      imageId: image.id,
      slug: 'breaking-news',
      canonicalUrl: 'https://example.com/original',
      authorIds: [author.id],
      hideAuthor: true,
      tags: [tag.id],
      paywallId: paywall.id,
      breaking: true,
      hidden: false,
      disableComments: true,
      seoTitle: 'Search title',
      seoDescription: 'Search lead',
      socialMediaTitle: 'Share title',
      socialMediaDescription: 'Share lead',
      socialMediaImageId: socialMediaImage.id,
      properties: [],
    });
  });

  it('leaves out the paywall of an article without one', () => {
    expect(articleRootProps({ ...article, paywall: null })).not.toHaveProperty(
      'paywallId'
    );
  });
});
