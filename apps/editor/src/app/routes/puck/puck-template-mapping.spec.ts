import {
  ArticleTemplateMetadataFragment,
  FullArticleFragment,
  FullArticleTemplateFragment,
  FullPageFragment,
  FullPageTemplateFragment,
  PageTemplateMetadataFragment,
  PuckBlockInput,
  PuckBlockKind,
} from '@wepublish/editor/api';
import { PuckDocument } from '@wepublish/puck-content/editor';

import {
  articleTemplateToRootProps,
  articleToTemplateRootProps,
  loadPuckTemplate,
  pageTemplateToRootProps,
  pageToTemplateRootProps,
  TEMPLATE_NAME_PROP,
  templateNameOf,
  toArticleTemplateMetadataInput,
  toCreateArticleTemplateVariables,
  toCreatePageTemplateVariables,
  toPageTemplateMetadataInput,
  toUpdateArticleTemplateVariables,
  toUpdatePageTemplateVariables,
} from './puck-template-mapping';

const author = (id: string, name: string) => ({
  __typename: 'Author',
  id,
  name,
});

const image = (id: string) => ({ __typename: 'Image', id });

const property = {
  __typename: 'Property',
  key: 'key',
  value: 'value',
  public: false,
};

const articleMetadata = {
  __typename: 'ArticleTemplateMetadata',
  preTitle: 'Kicker',
  title: 'Title',
  lead: null,
  seoTitle: null,
  seoDescription: 'Seo description',
  canonicalUrl: null,
  breaking: true,
  hideAuthor: false,
  shared: false,
  hidden: false,
  disableComments: true,
  paywallId: 'paywall-1',
  socialMediaTitle: null,
  socialMediaDescription: null,
  tags: [{ __typename: 'Tag', id: 'tag-1', tag: 'News' }],
  authors: [
    {
      __typename: 'ArticleRevisionAuthor',
      role: 'Photos',
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
} as unknown as ArticleTemplateMetadataFragment;

const pageMetadata = {
  __typename: 'PageTemplateMetadata',
  title: 'About',
  description: 'About the team',
  seoTitle: null,
  seoDescription: null,
  hidden: true,
  hideHeader: true,
  hideFooter: false,
  socialMediaTitle: null,
  socialMediaDescription: 'Social',
  tags: [{ __typename: 'Tag', id: 'tag-2', tag: 'Team' }],
  image: null,
  socialMediaImage: image('image-2'),
  properties: [property],
} as unknown as PageTemplateMetadataFragment;

const heading = {
  __typename: 'PuckBlock',
  id: 'Heading-1',
  kind: PuckBlockKind.Puck,
  type: 'Heading',
  props: { text: 'Hello' },
  parentId: null,
  puckSlot: null,
  position: 0,
};

const articleTemplate = {
  __typename: 'ArticleTemplate',
  id: 'article-template-1',
  blockTemplate: {
    __typename: 'BlockTemplate',
    id: 'block-template-1',
    name: 'News',
    blocks: [],
    puckBlocks: [heading],
    puckRegistry: null,
  },
  metadata: articleMetadata,
} as unknown as FullArticleTemplateFragment;

const pageTemplate = {
  __typename: 'PageTemplate',
  id: 'page-template-1',
  blockTemplate: {
    __typename: 'BlockTemplate',
    id: 'block-template-2',
    name: 'Landing',
    blocks: [],
    puckBlocks: [],
    puckRegistry: null,
  },
  metadata: pageMetadata,
} as unknown as FullPageTemplateFragment;

const puckBlocks: PuckBlockInput[] = [
  { id: 'Heading-1', kind: PuckBlockKind.Puck, type: 'Heading', props: {} },
];

describe('articleTemplateToRootProps', () => {
  it('maps the template metadata to the root props of an article', () => {
    expect(articleTemplateToRootProps(articleMetadata)).toEqual({
      preTitle: 'Kicker',
      title: 'Title',
      imageId: 'image-1',
      authorIds: ['author-1', 'author-2'],
      hideAuthor: false,
      tags: ['tag-1'],
      paywallId: 'paywall-1',
      breaking: true,
      hidden: false,
      disableComments: true,
      shared: false,
      seoDescription: 'Seo description',
      properties: [{ key: 'key', value: 'value', public: false }],
    });
  });
});

describe('toArticleTemplateMetadataInput', () => {
  it('maps the root props back to the template metadata without a slug', () => {
    const input = toArticleTemplateMetadataInput(
      { ...articleTemplateToRootProps(articleMetadata), slug: 'ignored' },
      articleMetadata
    );

    expect(input).not.toHaveProperty('slug');
    expect(input).toEqual(
      expect.objectContaining({
        preTitle: 'Kicker',
        title: 'Title',
        breaking: true,
        disableComments: true,
        paywallId: 'paywall-1',
        imageID: 'image-1',
        tagIds: ['tag-1'],
        properties: [{ key: 'key', value: 'value', public: false }],
      })
    );
  });

  it('keeps the roles and social media authors of the template', () => {
    expect(
      toArticleTemplateMetadataInput(
        { authorIds: ['author-2', 'author-1'] },
        articleMetadata
      )
    ).toEqual(
      expect.objectContaining({
        authors: [
          { authorId: 'author-2', role: undefined },
          { authorId: 'author-1', role: 'Photos' },
        ],
        socialMediaAuthorIds: ['author-2'],
      })
    );
  });
});

describe('pageTemplateToRootProps', () => {
  it('maps the template metadata to the root props of a page', () => {
    expect(pageTemplateToRootProps(pageMetadata)).toEqual({
      title: 'About',
      lead: 'About the team',
      tags: ['tag-2'],
      hidden: true,
      showNavigation: false,
      showFooter: true,
      socialMediaDescription: 'Social',
      socialMediaImageId: 'image-2',
      properties: [{ key: 'key', value: 'value', public: false }],
    });
  });

  it('maps the root props back to the template metadata without a slug', () => {
    const input = toPageTemplateMetadataInput({
      ...pageTemplateToRootProps(pageMetadata),
      slug: 'ignored',
    });

    expect(input).not.toHaveProperty('slug');
    expect(input).toEqual(
      expect.objectContaining({
        title: 'About',
        description: 'About the team',
        hidden: true,
        hideHeader: true,
        hideFooter: false,
        tagIds: ['tag-2'],
        socialMediaImageID: 'image-2',
      })
    );
  });
});

describe('templates of existing documents', () => {
  it('takes the root props of an article without its slug', () => {
    const article = {
      slug: 'the-slug',
      shared: false,
      hidden: false,
      disableComments: false,
      paywallId: null,
      tags: [],
      latest: {
        title: 'Title',
        authors: [],
        socialMediaAuthors: [],
        properties: [],
        image: null,
        socialMediaImage: null,
      },
    } as unknown as FullArticleFragment;

    expect(articleToTemplateRootProps(article)).not.toHaveProperty('slug');
    expect(articleToTemplateRootProps(article)).toEqual(
      expect.objectContaining({ title: 'Title' })
    );
  });

  it('takes the root props of a page without its slug', () => {
    const page = {
      slug: 'about',
      hidden: false,
      hideHeader: false,
      hideFooter: false,
      tags: [],
      latest: {
        title: 'About',
        properties: [],
        image: null,
        socialMediaImage: null,
      },
    } as unknown as FullPageFragment;

    expect(pageToTemplateRootProps(page)).not.toHaveProperty('slug');
    expect(pageToTemplateRootProps(page)).toEqual(
      expect.objectContaining({ title: 'About' })
    );
  });
});

describe('loadPuckTemplate', () => {
  it('loads the puck blocks and the template name into the editor data', () => {
    const { data } = loadPuckTemplate(
      'article',
      articleTemplate.blockTemplate,
      articleTemplateToRootProps(articleTemplate.metadata)
    );

    expect(data?.content).toEqual([
      expect.objectContaining({
        type: 'Heading',
        props: expect.objectContaining({ id: 'Heading-1', text: 'Hello' }),
      }),
    ]);
    expect(data?.root.props).toEqual(
      expect.objectContaining({ title: 'Title', [TEMPLATE_NAME_PROP]: 'News' })
    );
  });

  it('loads an empty page template with its root props', () => {
    const { data } = loadPuckTemplate(
      'page',
      pageTemplate.blockTemplate,
      pageTemplateToRootProps(pageTemplate.metadata)
    );

    expect(data?.content).toEqual([]);
    expect(data?.root.props).toEqual(
      expect.objectContaining({
        showNavigation: false,
        [TEMPLATE_NAME_PROP]: 'Landing',
      })
    );
  });

  it('loads a template without a name as an unnamed one', () => {
    const { data } = loadPuckTemplate('page', undefined, {});

    expect(data?.content).toEqual([]);
    expect(templateNameOf(data?.root.props)).toBe('');
  });
});

describe('template variables', () => {
  const articleDocument = {
    puckBlocks,
    puckRegistry: null,
    rootProps: {
      title: 'Title',
      authorIds: ['author-1'],
      [TEMPLATE_NAME_PROP]: ' News ',
    },
  } as PuckDocument<'article'>;

  const pageDocument = {
    puckBlocks,
    puckRegistry: null,
    rootProps: { title: 'About', [TEMPLATE_NAME_PROP]: 'Landing' },
  } as PuckDocument<'page'>;

  it('reads the trimmed template name from the root props', () => {
    expect(templateNameOf(articleDocument.rootProps)).toBe('News');
    expect(templateNameOf(undefined)).toBe('');
  });

  it('creates an article template with its puck document and no legacy blocks', () => {
    const variables = toCreateArticleTemplateVariables(
      articleDocument,
      articleMetadata
    );

    expect(variables).toEqual({
      name: 'News',
      puckBlocks,
      puckRegistry: null,
      metadata: expect.objectContaining({
        title: 'Title',
        authors: [{ authorId: 'author-1', role: 'Photos' }],
      }),
    });
    expect(variables.metadata).not.toHaveProperty(TEMPLATE_NAME_PROP);
  });

  it('updates an article template without touching its legacy blocks', () => {
    const variables = toUpdateArticleTemplateVariables(
      'article-template-1',
      articleDocument,
      articleMetadata
    );

    expect(variables).toEqual(
      expect.objectContaining({
        id: 'article-template-1',
        name: 'News',
        puckBlocks,
        puckRegistry: null,
      })
    );
    expect(variables).not.toHaveProperty('blocks');
  });

  it('creates and updates a page template with its puck document', () => {
    expect(toCreatePageTemplateVariables(pageDocument)).toEqual({
      name: 'Landing',
      puckBlocks,
      puckRegistry: null,
      metadata: expect.objectContaining({ title: 'About' }),
    });
    expect(
      toUpdatePageTemplateVariables('page-template-1', pageDocument)
    ).toEqual({
      id: 'page-template-1',
      name: 'Landing',
      puckBlocks,
      puckRegistry: null,
      metadata: expect.objectContaining({ title: 'About' }),
    });
  });

  it('keeps the template name out of the stored metadata', () => {
    expect(
      toPageTemplateMetadataInput(pageDocument.rootProps as never)
    ).not.toHaveProperty(TEMPLATE_NAME_PROP);
  });
});
