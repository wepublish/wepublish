import {
  FullArticleFragment,
  FullPageFragment,
  FullPuckBlockFragment,
  PuckBackgroundSize,
  PuckBlockInput,
  PuckBorderStyle,
  PuckBreakpoint,
  PuckDatasourceType,
  PuckFontWeight,
  PuckListDatasourceType,
  PuckTextAlign,
  PuckTextTransform,
  PuckWeekday,
  Weekday,
} from '@wepublish/editor/api';
import {
  ApiBlock,
  PuckData,
  toApiDocument,
} from '@wepublish/puck-content/website';

import {
  articleRootPropsToInput,
  articleToRootProps,
  loadPuckDocument,
  pageRootPropsToInput,
  pageToRootProps,
  toCreateArticleVariables,
  toCreatePageVariables,
  toPuckBlockInputs,
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

const gridData = {
  layout: { xs: { columns: [1], gap: 2 } },
  content: [],
};

const blocks: ApiBlock[] = [
  {
    id: 'Grid-1',
    type: 'Grid',
    locked: true,
    visibility: {
      disabled: false,
      breakpoints: ['md', 'lg'],
      timings: {
        from: '2026-11-01T08:00:00.000Z',
        to: '2026-11-30T08:00:00.000Z',
        weekdays: [Weekday.Monday, Weekday.Friday],
        timeOfDay: { from: '08:00', to: '18:00' },
      },
    },
    styling: {
      typography: 'h2',
      textAlign: 'center',
      color: 'primary.main',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      background: '#1a1a1a80',
      backgroundImage: 'image-1',
      backgroundSize: 'contain',
      backgroundPosition: 'left top',
      overlay: 'common.black',
      overlayOpacity: 40,
      margin: { top: 2, bottom: '12px' },
      padding: { left: 1 },
      border: { width: { top: 1 }, style: 'dashed', color: '#fff' },
      borderRadius: { topLeft: 1, bottomRight: '8px' },
      minHeight: '50vh',
      maxWidth: 'md',
      shadow: 4,
      opacity: 90,
    },
    datasources: {
      article: { type: 'multiple', ids: ['article-2', 'article-3'] },
      page: { type: 'single', id: 'page-2' },
      event: { type: 'uniqueList' },
      userSubscription: { type: 'list' },
    },
    data: gridData,
    children: [
      {
        id: 'Title-1',
        type: 'Title',
        data: { title: 'First' },
      },
      {
        id: 'Title-2',
        type: 'Title',
        data: { title: 'Second' },
      },
    ],
  },
  {
    id: 'Title-3',
    type: 'Title',
    data: { title: 'After the grid' },
  },
];

const blockInputs: PuckBlockInput[] = [
  {
    id: 'Grid-1',
    type: 'Grid',
    locked: true,
    visibility: {
      disabled: false,
      breakpoints: [PuckBreakpoint.Md, PuckBreakpoint.Lg],
      timings: {
        from: '2026-11-01T08:00:00.000Z',
        to: '2026-11-30T08:00:00.000Z',
        weekdays: [PuckWeekday.Monday, PuckWeekday.Friday],
        timeOfDay: { from: '08:00', to: '18:00' },
      },
    },
    styling: {
      typography: 'h2',
      textAlign: PuckTextAlign.Center,
      color: 'primary.main',
      fontWeight: PuckFontWeight.Bold,
      textTransform: PuckTextTransform.Uppercase,
      background: '#1a1a1a80',
      backgroundImage: 'image-1',
      backgroundSize: PuckBackgroundSize.Contain,
      backgroundPosition: 'left top',
      overlay: 'common.black',
      overlayOpacity: 40,
      margin: { top: 2, bottom: '12px' },
      padding: { left: 1 },
      border: {
        width: { top: 1 },
        style: PuckBorderStyle.Dashed,
        color: '#fff',
      },
      borderRadius: { topLeft: 1, bottomRight: '8px' },
      minHeight: '50vh',
      maxWidth: 'md',
      shadow: 4,
      opacity: 90,
    },
    datasources: {
      article: {
        type: PuckDatasourceType.Multiple,
        ids: ['article-2', 'article-3'],
      },
      page: { type: PuckDatasourceType.Single, id: 'page-2' },
      event: { type: PuckDatasourceType.UniqueList },
      userSubscription: { type: PuckListDatasourceType.List },
    },
    data: gridData,
    children: [
      { id: 'Title-1', type: 'Title', data: { title: 'First' } },
      { id: 'Title-2', type: 'Title', data: { title: 'Second' } },
    ],
  },
  { id: 'Title-3', type: 'Title', data: { title: 'After the grid' } },
];

const emptyStyling = {
  __typename: 'PuckBlockStyling',
  typography: null,
  textAlign: null,
  color: null,
  fontWeight: null,
  textTransform: null,
  background: null,
  backgroundImage: null,
  backgroundSize: null,
  backgroundPosition: null,
  overlay: null,
  overlayOpacity: null,
  margin: null,
  padding: null,
  border: null,
  borderRadius: null,
  minHeight: null,
  maxWidth: null,
  shadow: null,
  opacity: null,
} as const;

const datasource = (
  type: PuckDatasourceType,
  picks: { id?: string; ids?: string[] } = {}
) => ({
  __typename: 'PuckBlockDatasource' as const,
  type,
  id: picks.id ?? null,
  ids: picks.ids ?? null,
});

const flatBlock = (
  block: Pick<FullPuckBlockFragment, 'id' | 'type' | 'data'> &
    Partial<FullPuckBlockFragment>
): FullPuckBlockFragment => ({
  __typename: 'PuckBlock',
  parentId: null,
  slot: null,
  position: 0,
  locked: null,
  visibility: null,
  styling: null,
  datasources: null,
  ...block,
});

const flatPuckBlocks: FullPuckBlockFragment[] = [
  flatBlock({
    id: 'Grid-1',
    type: 'Grid',
    locked: true,
    data: gridData,
    visibility: {
      __typename: 'PuckBlockVisibility',
      disabled: false,
      breakpoints: [PuckBreakpoint.Md, PuckBreakpoint.Lg],
      timings: {
        __typename: 'PuckBlockTimings',
        from: '2026-11-01T08:00:00.000Z',
        to: '2026-11-30T08:00:00.000Z',
        weekdays: [PuckWeekday.Monday, PuckWeekday.Friday],
        timeOfDay: {
          __typename: 'PuckBlockTimeOfDay',
          from: '08:00',
          to: '18:00',
        },
      },
    },
    styling: {
      ...emptyStyling,
      typography: 'h2',
      textAlign: PuckTextAlign.Center,
      color: 'primary.main',
      fontWeight: PuckFontWeight.Bold,
      textTransform: PuckTextTransform.Uppercase,
      background: '#1a1a1a80',
      backgroundImage: 'image-1',
      backgroundSize: PuckBackgroundSize.Contain,
      backgroundPosition: 'left top',
      overlay: 'common.black',
      overlayOpacity: 40,
      margin: {
        __typename: 'PuckSpacingSides',
        top: 2,
        right: null,
        bottom: '12px',
        left: null,
      },
      padding: {
        __typename: 'PuckSpacingSides',
        top: null,
        right: null,
        bottom: null,
        left: 1,
      },
      border: {
        __typename: 'PuckBorder',
        style: PuckBorderStyle.Dashed,
        color: '#fff',
        width: {
          __typename: 'PuckBorderWidth',
          top: 1,
          right: null,
          bottom: null,
          left: null,
        },
      },
      borderRadius: {
        __typename: 'PuckBorderRadius',
        topLeft: 1,
        topRight: null,
        bottomRight: '8px',
        bottomLeft: null,
      },
      minHeight: '50vh',
      maxWidth: 'md',
      shadow: 4,
      opacity: 90,
    },
    datasources: {
      __typename: 'PuckBlockDatasources',
      article: datasource(PuckDatasourceType.Multiple, {
        ids: ['article-2', 'article-3'],
      }),
      page: datasource(PuckDatasourceType.Single, { id: 'page-2' }),
      event: datasource(PuckDatasourceType.UniqueList),
      image: null,
      memberPlan: null,
      userSubscription: {
        __typename: 'PuckBlockListDatasource',
        type: PuckListDatasourceType.List,
      },
    },
  }),
  flatBlock({
    id: 'Title-1',
    type: 'Title',
    parentId: 'Grid-1',
    slot: 'content',
    data: { title: 'First' },
  }),
  flatBlock({
    id: 'Title-2',
    type: 'Title',
    parentId: 'Grid-1',
    slot: 'content',
    position: 1,
    data: { title: 'Second' },
  }),
  flatBlock({
    id: 'Title-3',
    type: 'Title',
    position: 1,
    data: { title: 'After the grid' },
  }),
];

const puckContent = [
  {
    type: 'Grid',
    props: {
      ...gridData,
      content: [
        { type: 'Title', props: { title: 'First', id: 'Title-1' } },
        { type: 'Title', props: { title: 'Second', id: 'Title-2' } },
      ],
      id: 'Grid-1',
      locked: true,
      visibility: blocks[0].visibility,
      styling: blocks[0].styling,
      datasources: blocks[0].datasources,
    },
  },
  { type: 'Title', props: { title: 'After the grid', id: 'Title-3' } },
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
  const rootProps = articleToRootProps(article);

  it('updates an article with its puck blocks and leaves the legacy blocks alone', () => {
    const variables = toUpdateArticleVariables(
      'article-1',
      { blocks, rootProps },
      article
    );

    expect(variables).toEqual({
      id: 'article-1',
      ...articleRootPropsToInput(rootProps, article),
      puckBlocks: blockInputs,
    });
    expect(variables).not.toHaveProperty('blocks');
    expect(variables).not.toHaveProperty('likes');
  });

  it('creates an article with its puck blocks and no likes yet', () => {
    const variables = toCreateArticleVariables({ blocks, rootProps });

    expect(variables).toEqual({
      ...articleRootPropsToInput(rootProps),
      likes: 0,
      puckBlocks: blockInputs,
    });
    expect(variables).not.toHaveProperty('blocks');
  });

  it('keeps the likes of the article a new one is created from', () => {
    expect(toCreateArticleVariables({ blocks, rootProps }, article).likes).toBe(
      7
    );
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
  const rootProps = pageToRootProps(page);

  it('updates a page with its puck blocks and leaves the legacy blocks alone', () => {
    const variables = toUpdatePageVariables('page-1', { blocks, rootProps });

    expect(variables).toEqual({
      id: 'page-1',
      ...pageRootPropsToInput(rootProps),
      puckBlocks: blockInputs,
    });
    expect(variables).not.toHaveProperty('blocks');
  });

  it('creates a page with its puck blocks', () => {
    const variables = toCreatePageVariables({ blocks, rootProps });

    expect(variables).toEqual({
      ...pageRootPropsToInput(rootProps),
      puckBlocks: blockInputs,
    });
    expect(variables).not.toHaveProperty('blocks');
  });
});

describe('toPuckBlockInputs', () => {
  it('sends the blocks as a tree of puck block inputs', () => {
    expect(toPuckBlockInputs(blocks)).toEqual(blockInputs);
  });

  it('leaves out what a block does not set', () => {
    expect(
      toPuckBlockInputs([{ id: 'Title-1', type: 'Title', data: {} }])
    ).toStrictEqual([{ id: 'Title-1', type: 'Title', data: {} }]);
  });

  it('drops the values the editor cleared', () => {
    expect(
      toPuckBlockInputs([
        {
          id: 'Title-1',
          type: 'Title',
          data: {},
          visibility: {
            timings: { from: null, to: '2026-11-30T08:00:00.000Z' },
          },
          datasources: { article: null, page: { type: 'list' } },
        },
      ])
    ).toStrictEqual([
      {
        id: 'Title-1',
        type: 'Title',
        data: {},
        visibility: { timings: { to: '2026-11-30T08:00:00.000Z' } },
        datasources: { page: { type: PuckDatasourceType.List } },
      },
    ]);
  });

  it('sends border widths as pixels', () => {
    expect(
      toPuckBlockInputs([
        {
          id: 'Title-1',
          type: 'Title',
          data: {},
          styling: { border: { width: { top: '3px', left: 1 } } },
        },
      ])[0].styling
    ).toEqual({ border: { width: { top: 3, left: 1 } } });
  });

  it('saves what a loaded document holds unchanged', () => {
    const { data } = loadPuckDocument('article', flatPuckBlocks, {});

    expect(
      toPuckBlockInputs(
        toApiDocument('article', data as PuckData<'article'>).blocks
      )
    ).toEqual(blockInputs);
  });
});

describe('loadPuckDocument', () => {
  it('rebuilds nested puck content from the flat puck blocks of the API', () => {
    expect(
      loadPuckDocument('article', flatPuckBlocks, { title: 'Title' })
    ).toEqual({
      data: { root: { props: { title: 'Title' } }, content: puckContent },
    });
  });

  it('places the blocks by position whatever order the API sends them in', () => {
    expect(
      loadPuckDocument('page', [...flatPuckBlocks].reverse(), {}).data?.content
    ).toEqual(puckContent);
  });

  it('turns saved puck blocks and root props into puck data', () => {
    expect(loadPuckDocument('page', [], { title: 'About us' })).toEqual({
      data: { root: { props: { title: 'About us' } }, content: [] },
    });
  });

  it('starts a document without saved puck blocks empty', () => {
    expect(loadPuckDocument('article', null, {})).toEqual({
      data: { root: { props: {} }, content: [] },
    });
  });

  it('reports puck blocks it cannot load instead of throwing', () => {
    expect(
      loadPuckDocument(
        'page',
        [{ nonsense: true }] as unknown as FullPuckBlockFragment[],
        {}
      )
    ).toEqual({
      error: expect.any(Error),
    });
  });
});
