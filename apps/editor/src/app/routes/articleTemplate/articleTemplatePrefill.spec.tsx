import { renderHook } from '@testing-library/react';
import { EditorBlockType } from '@wepublish/editor/api';

import {
  useArticlePrefill,
  useArticleTemplatePrefill,
} from './articleTemplatePrefill';

const useArticleTemplateQuery = vi.fn();
const useArticleQuery = vi.fn();

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => ({
  ...((await importOriginal()) as object),
  useQuery: (document: unknown, options?: unknown) => {
    switch (operationName(document)) {
      case 'ArticleTemplate':
        return useArticleTemplateQuery(options);
      case 'Article':
        return useArticleQuery(options);
    }
  },
}));

const articleTemplate = (modifiedAt = '2026-01-01T00:00:00.000Z') => ({
  __typename: 'ArticleTemplate',
  id: 'article-template-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt,
  blockTemplate: {
    __typename: 'BlockTemplate',
    id: 'block-template-1',
    name: 'News',
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt,
    blocks: [
      {
        __typename: 'TitleBlock',
        type: 'title',
        blockStyle: null,
        disabled: false,
        preTitle: null,
        title: 'Template Title',
        lead: null,
      },
      {
        __typename: 'BlockTemplateBlock',
        type: 'blockTemplate',
        blockStyle: null,
        disabled: false,
        templateId: 'nested-template',
        template: {
          __typename: 'BlockTemplate',
          id: 'nested-template',
          name: 'Nested',
          createdAt: '2026-01-01T00:00:00.000Z',
          modifiedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    ],
  },
  metadata: {
    __typename: 'ArticleTemplateMetadata',
    title: 'Metadata Title',
    breaking: true,
    hideAuthor: false,
    shared: false,
    hidden: false,
    disableComments: false,
    paywallId: null,
    tags: [{ __typename: 'Tag', id: 'tag-1', tag: 'Tag' }],
    authors: [],
    socialMediaAuthors: [],
    image: null,
    socialMediaImage: null,
    properties: [],
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  useArticleTemplateQuery.mockReturnValue({ data: undefined, loading: false });
  useArticleQuery.mockReturnValue({ data: undefined, loading: false });
});

describe('useArticleTemplatePrefill', () => {
  it('should not query a template without a template id', () => {
    const onPrefill = vi.fn();

    renderHook(() => useArticleTemplatePrefill(null, onPrefill));

    expect(useArticleTemplateQuery).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true })
    );
    expect(onPrefill).not.toHaveBeenCalled();
  });

  it('should prefill the top level blocks and the metadata of the template', () => {
    useArticleTemplateQuery.mockReturnValue({
      data: { articleTemplate: articleTemplate() },
      loading: false,
    });
    const onPrefill = vi.fn();

    renderHook(() =>
      useArticleTemplatePrefill('article-template-1', onPrefill)
    );

    expect(useArticleTemplateQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { id: 'article-template-1' },
        skip: false,
      })
    );
    expect(onPrefill).toHaveBeenCalledTimes(1);

    const [{ name, blocks, metadata }] = onPrefill.mock.calls[0];

    expect(name).toBe('News');

    expect(blocks).toEqual([
      expect.objectContaining({
        type: EditorBlockType.Title,
        value: expect.objectContaining({ title: 'Template Title' }),
      }),
      expect.objectContaining({
        type: EditorBlockType.BlockTemplate,
        value: expect.objectContaining({
          template: expect.objectContaining({ id: 'nested-template' }),
        }),
      }),
    ]);
    expect(metadata).toEqual(
      expect.objectContaining({
        title: 'Metadata Title',
        breaking: true,
        tags: ['tag-1'],
      })
    );
  });

  it('should be loading until the template has been prefilled', () => {
    useArticleTemplateQuery.mockReturnValue({ data: undefined, loading: true });
    const onPrefill = vi.fn();
    const renders: { loading: boolean; prefilled: boolean }[] = [];

    const { result, rerender } = renderHook(() => {
      const prefill = useArticleTemplatePrefill(
        'article-template-1',
        onPrefill
      );
      renders.push({
        loading: prefill.loading,
        prefilled: onPrefill.mock.calls.length > 0,
      });

      return prefill;
    });

    useArticleTemplateQuery.mockReturnValue({
      data: { articleTemplate: articleTemplate() },
      loading: false,
    });
    rerender();

    expect(onPrefill).toHaveBeenCalled();
    expect(
      renders.filter(({ loading, prefilled }) => !loading && !prefilled)
    ).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should stop loading if the template does not exist', () => {
    useArticleTemplateQuery.mockReturnValue({
      data: { articleTemplate: null },
      loading: false,
    });

    const { result } = renderHook(() =>
      useArticleTemplatePrefill('missing', vi.fn())
    );

    expect(result.current.loading).toBe(false);
  });

  it('should only prefill once', () => {
    useArticleTemplateQuery.mockReturnValue({
      data: { articleTemplate: articleTemplate() },
      loading: false,
    });
    const onPrefill = vi.fn();

    const { rerender } = renderHook(() =>
      useArticleTemplatePrefill('article-template-1', onPrefill)
    );

    useArticleTemplateQuery.mockReturnValue({
      data: { articleTemplate: articleTemplate('2026-02-02T00:00:00.000Z') },
      loading: false,
    });
    rerender();

    expect(onPrefill).toHaveBeenCalledTimes(1);
  });
});

const article = {
  __typename: 'Article',
  id: 'article-1',
  slug: 'slug',
  url: 'https://example.com/a/slug',
  shared: false,
  hidden: false,
  disableComments: false,
  likes: 12,
  paywallId: 'paywall-1',
  tags: [{ __typename: 'Tag', id: 'tag-1', tag: 'Tag' }],
  trackingPixels: [],
  latest: {
    __typename: 'ArticleRevision',
    preTitle: null,
    title: 'Article Title',
    lead: null,
    seoTitle: null,
    seoDescription: null,
    breaking: false,
    hideAuthor: true,
    canonicalUrl: null,
    socialMediaTitle: null,
    socialMediaDescription: null,
    authors: [],
    socialMediaAuthors: [],
    image: null,
    socialMediaImage: null,
    properties: [],
    blocks: [
      {
        __typename: 'TitleBlock',
        type: 'title',
        blockStyle: null,
        disabled: false,
        preTitle: null,
        title: 'Block Title',
        lead: null,
      },
    ],
  },
};

describe('useArticlePrefill', () => {
  it('should not query an article without an article id', () => {
    const onPrefill = vi.fn();

    renderHook(() => useArticlePrefill(null, onPrefill));

    expect(useArticleQuery).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true })
    );
    expect(onPrefill).not.toHaveBeenCalled();
  });

  it('should prefill the name, blocks and metadata of the article once', () => {
    useArticleQuery.mockReturnValue({
      data: { article },
      loading: false,
    });
    const onPrefill = vi.fn();

    const { rerender } = renderHook(() =>
      useArticlePrefill('article-1', onPrefill)
    );
    rerender();

    expect(useArticleQuery).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: 'article-1' }, skip: false })
    );
    expect(onPrefill).toHaveBeenCalledTimes(1);

    const [{ name, blocks, metadata }] = onPrefill.mock.calls[0];

    expect(name).toBe('Article Title');
    expect(blocks).toEqual([
      expect.objectContaining({
        type: EditorBlockType.Title,
        value: expect.objectContaining({ title: 'Block Title' }),
      }),
    ]);
    expect(metadata).toEqual(
      expect.objectContaining({
        hideAuthor: true,
        paywall: 'paywall-1',
        tags: ['tag-1'],
      })
    );
    expect(metadata).not.toHaveProperty('slug');
    expect(metadata).not.toHaveProperty('likes');
    expect(metadata).not.toHaveProperty('url');
    expect(metadata).not.toHaveProperty('trackingPixels');
  });
});
