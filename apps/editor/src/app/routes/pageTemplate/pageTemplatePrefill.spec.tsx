import { renderHook } from '@testing-library/react';
import { EditorBlockType } from '@wepublish/editor/api';

import { usePagePrefill, usePageTemplatePrefill } from './pageTemplatePrefill';

const pageTemplateQueryMock = vi.fn();
const pageQueryMock = vi.fn();

vi.mock('@apollo/client/react', async importOriginal => {
  const { routeApolloByOperation } = await import('../templates/testUtils');

  return routeApolloByOperation(await importOriginal(), {
    queries: {
      PageTemplate: options => pageTemplateQueryMock(options),
      Page: options => pageQueryMock(options),
    },
  });
});

const titleBlock = (title: string) => ({
  __typename: 'TitleBlock',
  type: 'title',
  blockStyle: null,
  disabled: false,
  preTitle: null,
  title,
  lead: null,
});

const pageTemplate = (modifiedAt = '2026-01-01T00:00:00.000Z') => ({
  __typename: 'PageTemplate',
  id: 'page-template-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt,
  blockTemplate: {
    __typename: 'BlockTemplate',
    id: 'block-template-1',
    name: 'Landing',
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt,
    blocks: [titleBlock('Template Title')],
  },
  metadata: {
    __typename: 'PageTemplateMetadata',
    title: 'Metadata Title',
    description: 'Metadata Description',
    seoTitle: null,
    seoDescription: null,
    hidden: true,
    socialMediaTitle: null,
    socialMediaDescription: null,
    tags: [{ __typename: 'Tag', id: 'tag-1', tag: 'Tag' }],
    image: null,
    socialMediaImage: null,
    properties: [],
  },
});

const page = {
  __typename: 'Page',
  id: 'page-1',
  slug: 'slug',
  url: 'https://example.com/slug',
  hidden: false,
  tags: [{ __typename: 'Tag', id: 'tag-2', tag: 'Other' }],
  latest: {
    __typename: 'PageRevision',
    title: 'Page Title',
    description: 'Page Description',
    seoTitle: null,
    seoDescription: null,
    image: null,
    socialMediaTitle: null,
    socialMediaDescription: null,
    socialMediaImage: null,
    properties: [],
    blocks: [titleBlock('Block Title')],
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  pageTemplateQueryMock.mockReturnValue({ data: undefined, loading: false });
  pageQueryMock.mockReturnValue({ data: undefined, loading: false });
});

describe('usePageTemplatePrefill', () => {
  it('should not query a template without a template id', () => {
    const onPrefill = vi.fn();

    renderHook(() => usePageTemplatePrefill(null, onPrefill));

    expect(pageTemplateQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true })
    );
    expect(onPrefill).not.toHaveBeenCalled();
  });

  it('should prefill the blocks and the metadata of the template once', () => {
    pageTemplateQueryMock.mockReturnValue({
      data: { pageTemplate: pageTemplate() },
      loading: false,
    });
    const onPrefill = vi.fn();

    const { rerender } = renderHook(() =>
      usePageTemplatePrefill('page-template-1', onPrefill)
    );

    pageTemplateQueryMock.mockReturnValue({
      data: { pageTemplate: pageTemplate('2026-02-02T00:00:00.000Z') },
      loading: false,
    });
    rerender();

    expect(pageTemplateQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { id: 'page-template-1' },
        skip: false,
      })
    );
    expect(onPrefill).toHaveBeenCalledTimes(1);

    const [{ name, blocks, metadata }] = onPrefill.mock.calls[0];

    expect(name).toBe('Landing');
    expect(blocks).toEqual([
      expect.objectContaining({
        type: EditorBlockType.Title,
        value: expect.objectContaining({ title: 'Template Title' }),
      }),
    ]);
    expect(metadata).toEqual(
      expect.objectContaining({
        title: 'Metadata Title',
        description: 'Metadata Description',
        hidden: true,
        tags: ['tag-1'],
      })
    );
  });

  it('should be loading while the template loads', () => {
    pageTemplateQueryMock.mockReturnValue({ data: undefined, loading: true });

    const { result } = renderHook(() =>
      usePageTemplatePrefill('page-template-1', vi.fn())
    );

    expect(result.current.loading).toBe(true);
  });
});

describe('usePagePrefill', () => {
  it('should not query a page without a page id', () => {
    renderHook(() => usePagePrefill(null, vi.fn()));

    expect(pageQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true })
    );
  });

  it('should prefill the name, blocks and metadata of the page without its slug and url', () => {
    pageQueryMock.mockReturnValue({ data: { page }, loading: false });
    const onPrefill = vi.fn();

    renderHook(() => usePagePrefill('page-1', onPrefill));

    expect(pageQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: 'page-1' }, skip: false })
    );
    expect(onPrefill).toHaveBeenCalledTimes(1);

    const [{ name, blocks, metadata }] = onPrefill.mock.calls[0];

    expect(name).toBe('Page Title');
    expect(blocks).toEqual([
      expect.objectContaining({
        value: expect.objectContaining({ title: 'Block Title' }),
      }),
    ]);
    expect(metadata).toEqual(
      expect.objectContaining({
        description: 'Page Description',
        tags: ['tag-2'],
      })
    );
    expect(metadata).not.toHaveProperty('slug');
    expect(metadata).not.toHaveProperty('url');
  });
});
