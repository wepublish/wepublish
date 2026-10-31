import {
  FullArticleFragment,
  FullPageFragment,
  FullPuckBlockFragment,
  FullPuckRegistryFragment,
  PuckBlockInput,
  PuckBlockKind,
  PuckDatasourceType,
} from '@wepublish/editor/api';
import { PuckDocument } from '@wepublish/puck-content/editor';

import {
  articleRootPropsToInput,
  articleToRootProps,
  loadPuckDocument,
  pageRootPropsToInput,
  pageToRootProps,
  toCreateArticleVariables,
  toCreatePageVariables,
  toUpdateArticleVariables,
  toUpdatePageVariables,
} from './puck-document-mapping';

const author = (id: string, name: string) => ({
  __typename: 'Author',
  id,
  name,
});

const image = (id: string) => ({
  __typename: 'Image',
  id,
  filename: `${id}.jpg`,
});

const property = {
  __typename: 'Property',
  key: 'key',
  value: 'value',
  public: true,
};

const article = {
  __typename: 'Article',
  id: 'article-1',
  slug: 'the-slug',
  url: 'https://example.com/a/the-slug',
  shared: true,
  hidden: false,
  disableComments: true,
  likes: 7,
  paywallId: 'paywall-1',
  tags: [{ __typename: 'Tag', id: 'tag-1', tag: 'News' }],
  latest: {
    __typename: 'ArticleRevision',
    preTitle: 'Kicker',
    title: 'Title',
    lead: 'Lead',
    seoTitle: null,
    seoDescription: 'Seo description',
    canonicalUrl: null,
    breaking: true,
    hideAuthor: false,
    socialMediaTitle: null,
    socialMediaDescription: 'Social description',
    authors: [
      {
        __typename: 'ArticleRevisionAuthor',
        role: 'Text',
        author: author('author-1', 'Ada'),
      },
      {
        __typename: 'ArticleRevisionAuthor',
        role: null,
        author: author('author-2', 'Grace'),
      },
    ],
    socialMediaAuthors: [author('author-2', 'Grace')],
    image: image('image-1'),
    socialMediaImage: null,
    properties: [property],
    puckBlocks: [],
    blocks: [],
  },
} as unknown as FullArticleFragment;

const page = {
  __typename: 'Page',
  id: 'page-1',
  slug: 'about',
  url: 'https://example.com/about',
  hidden: true,
  hideHeader: true,
  hideFooter: false,
  tags: [{ __typename: 'Tag', id: 'tag-2', tag: 'Team' }],
  latest: {
    __typename: 'PageRevision',
    title: 'About us',
    description: 'About the team',
    seoTitle: 'About',
    seoDescription: null,
    socialMediaTitle: null,
    socialMediaDescription: 'Social description',
    image: null,
    socialMediaImage: image('image-2'),
    properties: [property],
    puckBlocks: [],
    blocks: [],
  },
} as unknown as FullPageFragment;

const puckBlocks: PuckBlockInput[] = [
  {
    id: 'Grid-1',
    kind: PuckBlockKind.Puck,
    type: 'Grid',
    locked: true,
    datasources: { article: { type: PuckDatasourceType.UniqueList } },
    props: { layout: { xs: { columns: [1], gap: 2 } }, content: [] },
    children: [
      {
        id: 'Hero-2',
        kind: PuckBlockKind.Generated,
        type: 'Hero',
        props: { title: 'Designed' },
      },
    ],
  },
];

const puckRegistry = {
  components: { Hero: { html: '<h1 data-puck-field-name="title"></h1>' } },
  styles: 'h1 { color: red; }',
  script: 'console.log("hero")',
};

const registryFragment: FullPuckRegistryFragment = {
  __typename: 'PuckRegistry',
  ...puckRegistry,
};

const flatBlock = (
  block: Pick<FullPuckBlockFragment, 'id' | 'type'> &
    Partial<FullPuckBlockFragment>
): FullPuckBlockFragment => ({
  __typename: 'PuckBlock',
  kind: PuckBlockKind.Puck,
  parentId: null,
  puckSlot: null,
  position: 0,
  locked: null,
  props: {},
  visibility: null,
  styling: null,
  datasources: null,
  ...block,
});

const flatPuckBlocks: FullPuckBlockFragment[] = [
  flatBlock({
    id: 'Hero-2',
    kind: PuckBlockKind.Generated,
    type: 'Hero',
    parentId: 'Grid-1',
    puckSlot: 'content',
    props: { title: 'Designed' },
  }),
  flatBlock({
    id: 'Grid-1',
    type: 'Grid',
    locked: true,
    props: { layout: { xs: { columns: [1], gap: 2 } }, content: [] },
  }),
];

const puckContent = [
  {
    type: 'Grid',
    props: {
      id: 'Grid-1',
      locked: true,
      layout: { xs: { columns: [1], gap: 2 } },
      content: [{ type: 'Hero', props: { id: 'Hero-2', title: 'Designed' } }],
    },
  },
];

describe('articleToRootProps', () => {
  it('maps the article and its latest revision to the article root props', () => {
    expect(articleToRootProps(article)).toEqual({
      preTitle: 'Kicker',
      title: 'Title',
      lead: 'Lead',
      imageId: 'image-1',
      slug: 'the-slug',
      authorIds: ['author-1', 'author-2'],
      hideAuthor: false,
      tags: ['tag-1'],
      paywallId: 'paywall-1',
      breaking: true,
      hidden: false,
      disableComments: true,
      shared: true,
      seoDescription: 'Seo description',
      socialMediaDescription: 'Social description',
      socialMediaAuthorIds: ['author-2'],
      properties: [{ key: 'key', value: 'value', public: true }],
    });
  });

  it('leaves out the values the article does not have', () => {
    expect(Object.keys(articleToRootProps(article))).toEqual(
      expect.not.arrayContaining([
        'seoTitle',
        'canonicalUrl',
        'socialMediaTitle',
        'socialMediaImageId',
      ])
    );
  });
});

describe('articleRootPropsToInput', () => {
  it('maps the root props of a loaded article back to the same article input', () => {
    expect(
      articleRootPropsToInput(articleToRootProps(article), article)
    ).toEqual({
      preTitle: 'Kicker',
      title: 'Title',
      lead: 'Lead',
      seoTitle: undefined,
      seoDescription: 'Seo description',
      canonicalUrl: '',
      slug: 'the-slug',
      breaking: true,
      hideAuthor: false,
      shared: true,
      hidden: false,
      disableComments: true,
      paywallId: 'paywall-1',
      imageID: 'image-1',
      tagIds: ['tag-1'],
      authors: [
        { authorId: 'author-1', role: 'Text' },
        { authorId: 'author-2', role: undefined },
      ],
      properties: [{ key: 'key', value: 'value', public: true }],
      socialMediaTitle: undefined,
      socialMediaDescription: 'Social description',
      socialMediaAuthorIds: ['author-2'],
      socialMediaImageID: undefined,
    });
  });

  it('keeps the role of an author that stays and gives new authors none', () => {
    expect(
      articleRootPropsToInput({ authorIds: ['author-3', 'author-1'] }, article)
        .authors
    ).toEqual([
      { authorId: 'author-3', role: undefined },
      { authorId: 'author-1', role: 'Text' },
    ]);
  });

  it('fills the required values of an article without root props', () => {
    expect(articleRootPropsToInput({})).toEqual(
      expect.objectContaining({
        canonicalUrl: '',
        breaking: false,
        hideAuthor: false,
        shared: false,
        hidden: false,
        disableComments: false,
        tagIds: [],
        authors: [],
        properties: [],
        socialMediaAuthorIds: [],
      })
    );
  });

  it('clears the slug and the paywall the editor removed', () => {
    expect(articleRootPropsToInput({ slug: '', paywallId: '' })).toEqual(
      expect.objectContaining({ slug: null, paywallId: null })
    );
    expect(articleRootPropsToInput({})).toEqual(
      expect.objectContaining({ slug: null, paywallId: null })
    );
  });

  it('turns empty optional texts and images into undefined like the article editor', () => {
    expect(
      articleRootPropsToInput({
        preTitle: '',
        imageId: '',
        socialMediaTitle: '',
        socialMediaDescription: '',
        socialMediaImageId: '',
      })
    ).toEqual(
      expect.objectContaining({
        preTitle: undefined,
        imageID: undefined,
        socialMediaTitle: undefined,
        socialMediaDescription: undefined,
        socialMediaImageID: undefined,
      })
    );
  });
});

describe('article mutation variables', () => {
  const document: PuckDocument<'article'> = {
    puckBlocks,
    puckRegistry,
    rootProps: articleToRootProps(article),
  };

  it('updates an article with its puck blocks and registry and leaves the legacy blocks alone', () => {
    const variables = toUpdateArticleVariables('article-1', document, article);

    expect(variables).toEqual({
      id: 'article-1',
      ...articleRootPropsToInput(document.rootProps, article),
      puckBlocks,
      puckRegistry,
    });
    expect(variables).not.toHaveProperty('blocks');
    expect(variables).not.toHaveProperty('likes');
  });

  it('creates an article with its puck blocks, its registry and no likes yet', () => {
    const variables = toCreateArticleVariables(document);

    expect(variables).toEqual({
      ...articleRootPropsToInput(document.rootProps),
      likes: 0,
      puckBlocks,
      puckRegistry,
    });
    expect(variables).not.toHaveProperty('blocks');
  });

  it('keeps the likes of the article a new one is created from', () => {
    expect(toCreateArticleVariables(document, article).likes).toBe(7);
  });

  it('clears the registry of an article without generated components', () => {
    expect(
      toUpdateArticleVariables('article-1', {
        ...document,
        puckRegistry: null,
      }).puckRegistry
    ).toBeNull();
  });
});

describe('pageToRootProps', () => {
  it('maps the page and its latest revision to the page root props', () => {
    expect(pageToRootProps(page)).toEqual({
      title: 'About us',
      lead: 'About the team',
      slug: 'about',
      tags: ['tag-2'],
      hidden: true,
      showNavigation: false,
      showFooter: true,
      seoTitle: 'About',
      socialMediaDescription: 'Social description',
      socialMediaImageId: 'image-2',
      properties: [{ key: 'key', value: 'value', public: true }],
    });
  });

  it('takes the image of the latest revision', () => {
    expect(
      pageToRootProps({
        ...page,
        latest: { ...page.latest, image: image('image-1') },
      } as FullPageFragment).imageId
    ).toBe('image-1');
  });
});

describe('pageRootPropsToInput', () => {
  it('maps the root props of a loaded page back to the same page input', () => {
    expect(pageRootPropsToInput(pageToRootProps(page))).toEqual({
      title: 'About us',
      description: 'About the team',
      slug: 'about',
      seoTitle: 'About',
      seoDescription: undefined,
      hidden: true,
      hideHeader: true,
      hideFooter: false,
      imageID: undefined,
      tagIds: ['tag-2'],
      properties: [{ key: 'key', value: 'value', public: true }],
      socialMediaTitle: undefined,
      socialMediaDescription: 'Social description',
      socialMediaImageID: 'image-2',
    });
  });

  it('shows the navigation and the footer unless the editor turned them off', () => {
    expect(pageRootPropsToInput({})).toEqual(
      expect.objectContaining({ hideHeader: false, hideFooter: false })
    );
    expect(
      pageRootPropsToInput({ showNavigation: false, showFooter: false })
    ).toEqual(expect.objectContaining({ hideHeader: true, hideFooter: true }));
  });

  it('fills the required values of a page without root props', () => {
    expect(pageRootPropsToInput({})).toEqual(
      expect.objectContaining({
        title: '',
        slug: '',
        hidden: false,
        tagIds: [],
        properties: [],
      })
    );
  });
});

describe('page mutation variables', () => {
  const document: PuckDocument<'page'> = {
    puckBlocks,
    puckRegistry,
    rootProps: pageToRootProps(page),
  };

  it('updates a page with its puck blocks and registry and leaves the legacy blocks alone', () => {
    const variables = toUpdatePageVariables('page-1', document);

    expect(variables).toEqual({
      id: 'page-1',
      ...pageRootPropsToInput(document.rootProps),
      puckBlocks,
      puckRegistry,
    });
    expect(variables).not.toHaveProperty('blocks');
  });

  it('creates a page with its puck blocks and registry', () => {
    const variables = toCreatePageVariables(document);

    expect(variables).toEqual({
      ...pageRootPropsToInput(document.rootProps),
      puckBlocks,
      puckRegistry,
    });
    expect(variables).not.toHaveProperty('blocks');
  });

  it('clears the registry of a page without generated components', () => {
    expect(
      toCreatePageVariables({ ...document, puckRegistry: null }).puckRegistry
    ).toBeNull();
  });
});

describe('loadPuckDocument', () => {
  it('rebuilds nested puck content and the dynamic config from the API', () => {
    expect(
      loadPuckDocument('article', flatPuckBlocks, registryFragment, {
        title: 'Title',
      })
    ).toEqual({
      data: {
        root: { props: { title: 'Title', _dynamicConfig: puckRegistry } },
        content: puckContent,
      },
    });
  });

  it('turns saved puck blocks and root props into puck data', () => {
    expect(loadPuckDocument('page', [], null, { title: 'About us' })).toEqual({
      data: { root: { props: { title: 'About us' } }, content: [] },
    });
  });

  it('starts a document without saved puck blocks empty', () => {
    expect(loadPuckDocument('article', null, null, {})).toEqual({
      data: { root: { props: {} }, content: [] },
    });
  });

  it('reports puck blocks it cannot place instead of throwing', () => {
    expect(
      loadPuckDocument(
        'page',
        [flatBlock({ id: 'Title-1', type: 'Title', parentId: 'Grid-9' })],
        null,
        {}
      )
    ).toEqual({ error: expect.any(Error) });
  });
});
