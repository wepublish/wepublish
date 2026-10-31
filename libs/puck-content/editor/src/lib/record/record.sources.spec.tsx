import type { MockedResponse } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { act, renderHook, waitFor } from '@testing-library/react';
import {
  ArticleListDocument,
  ArticleSort,
  MemberPlanListDocument,
  MemberPlanSort,
  PageDocument,
  PageListDocument,
  PageSort,
  SortOrder,
} from '@wepublish/editor/api';
import { ReactNode } from 'react';

import { recordSources } from './record.sources';

const timestamp = '2026-10-01T00:00:00.000Z';

const image = {
  __typename: 'Image',
  id: 'img-1',
  createdAt: timestamp,
  modifiedAt: timestamp,
  title: 'Image',
  filename: 'image',
  extension: '.jpg',
  width: 100,
  height: 100,
  fileSize: 1,
  description: null,
  tags: [],
  source: null,
  link: null,
  license: null,
  focalPointX: 0.5,
  focalPointY: 0.5,
  url: 'https://cdn.test/image.jpg',
  largeURL: null,
  mediumURL: null,
  thumbURL: 'https://cdn.test/thumb.jpg',
  squareURL: 'https://cdn.test/square.jpg',
  previewURL: null,
  column1URL: null,
  column6URL: null,
};

const author = (id: string, name: string) => ({
  __typename: 'Author',
  id,
  name,
  jobTitle: null,
  slug: id,
  bio: null,
  url: `https://site.test/author/${id}`,
  createdAt: timestamp,
  modifiedAt: timestamp,
  peer: null,
  links: [],
  tags: [],
  imageID: null,
  image: null,
  hideOnArticle: false,
  hideOnTeaser: false,
  hideOnTeam: false,
});

const revisionState = (state: 'draft' | 'pending' | 'published') => ({
  draft: state === 'draft' ? { __typename: 'ArticleRevision', id: 'r' } : null,
  pending:
    state === 'pending' ?
      { __typename: 'ArticleRevision', id: 'r', publishedAt: timestamp }
    : null,
  published:
    state === 'published' ?
      { __typename: 'ArticleRevision', id: 'r', publishedAt: timestamp }
    : null,
});

const articleNode = (
  id: string,
  title: string,
  {
    state = 'published',
    preTitle = null,
    authors = [],
    withImage = false,
  }: {
    state?: 'draft' | 'pending' | 'published';
    preTitle?: string | null;
    authors?: ReturnType<typeof author>[];
    withImage?: boolean;
  } = {}
) => ({
  __typename: 'Article',
  id,
  publishedAt: timestamp,
  createdAt: timestamp,
  modifiedAt: timestamp,
  shared: false,
  hidden: false,
  disableComments: false,
  slug: id,
  likes: 0,
  url: `https://site.test/a/${id}`,
  previewUrl: `https://site.test/preview/${id}`,
  paywallId: null,
  latest: {
    __typename: 'ArticleRevision',
    id: `${id}-revision`,
    createdAt: timestamp,
    publishedAt: timestamp,
    archivedAt: null,
    preTitle,
    title,
    lead: null,
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    hideAuthor: false,
    breaking: false,
    socialMediaTitle: null,
    socialMediaDescription: null,
    authors: authors.map(entry => ({
      __typename: 'ArticleRevisionAuthor',
      role: null,
      author: entry,
    })),
    socialMediaAuthors: [],
    image: withImage ? image : null,
    socialMediaImage: null,
    properties: [],
  },
  ...revisionState(state),
  tags: [],
  peer: null,
  trackingPixels: [],
});

const pageNode = (
  id: string,
  title: string,
  state: 'draft' | 'pending' | 'published' = 'published'
) => ({
  __typename: 'Page',
  id,
  publishedAt: timestamp,
  createdAt: timestamp,
  modifiedAt: timestamp,
  slug: id,
  url: `https://site.test/${id}`,
  previewUrl: `https://site.test/preview/${id}`,
  hidden: false,
  hideHeader: false,
  hideFooter: false,
  tags: [],
  latest: {
    __typename: 'PageRevision',
    id: `${id}-revision`,
    createdAt: timestamp,
    publishedAt: timestamp,
    archivedAt: null,
    title,
    description: null,
    seoTitle: null,
    seoDescription: null,
    socialMediaTitle: null,
    socialMediaDescription: null,
    image: null,
    socialMediaImage: null,
    properties: [],
  },
  draft: state === 'draft' ? { __typename: 'PageRevision', id: 'r' } : null,
  pending:
    state === 'pending' ?
      { __typename: 'PageRevision', id: 'r', publishedAt: timestamp }
    : null,
  published:
    state === 'published' ?
      { __typename: 'PageRevision', id: 'r', publishedAt: timestamp }
    : null,
});

const memberPlanNode = (id: string, name: string) => ({
  __typename: 'MemberPlan',
  id,
  createdAt: timestamp,
  modifiedAt: timestamp,
  name,
  description: null,
  shortDescription: null,
  slug: id,
  active: true,
  productType: 'Subscription',
  tags: [],
  externalReward: null,
  currency: 'CHF',
  extendable: true,
  maxCount: null,
  migrateToTargetPaymentMethodID: null,
  periodicityPricing: [],
  defaultPaymentPeriodicity: null,
  successPageId: null,
  failPageId: null,
  confirmationPageId: null,
  image: null,
  availablePaymentMethods: [],
});

const connection = <Node,>(
  typename: string,
  nodes: Node[],
  { endCursor = null, hasNextPage = false } = {} as {
    endCursor?: string | null;
    hasNextPage?: boolean;
  }
) => ({
  __typename: typename,
  totalCount: nodes.length,
  nodes,
  pageInfo: {
    __typename: 'PageInfo',
    startCursor: null,
    endCursor,
    hasNextPage,
    hasPreviousPage: false,
  },
});

const articleSearchVariables = (title?: string) => ({
  filter: title ? { title, includeHidden: true } : { includeHidden: true },
  take: 20,
  sort: ArticleSort.ModifiedAt,
  order: SortOrder.Descending,
});

const pageSearchVariables = (title?: string) => ({
  filter: title ? { title, includeHidden: true } : { includeHidden: true },
  take: 20,
  sort: PageSort.ModifiedAt,
  order: SortOrder.Descending,
});

const withMocks =
  (mocks: MockedResponse[]) =>
  ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks}>{children}</MockedProvider>
  );

describe('record sources', () => {
  describe('article', () => {
    it('searches by title, newest first, and maps the rows', async () => {
      const { result } = renderHook(
        () => recordSources.article.useSearch(' climate '),
        {
          wrapper: withMocks([
            {
              request: {
                query: ArticleListDocument,
                variables: articleSearchVariables('climate'),
              },
              result: {
                data: {
                  articles: connection('PaginatedArticles', [
                    articleNode('a1', 'Climate report', {
                      preTitle: 'Analysis',
                      authors: [author('au1', 'Anna'), author('au2', 'Ben')],
                      withImage: true,
                    }),
                    articleNode('a2', 'Climate draft', { state: 'draft' }),
                  ]),
                },
              },
            },
          ]),
        }
      );

      await waitFor(() => expect(result.current.options).toHaveLength(2));

      expect(result.current.options).toEqual([
        {
          id: 'a1',
          title: 'Climate report',
          subtitle: 'Analysis · Anna, Ben',
          imageUrl: 'https://cdn.test/square.jpg',
          status: 'published',
        },
        {
          id: 'a2',
          title: 'Climate draft',
          subtitle: undefined,
          imageUrl: undefined,
          status: 'draft',
        },
      ]);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.loading).toBe(false);
    });

    it('loads the next page after the cursor without repeating it', async () => {
      const { result } = renderHook(() => recordSources.article.useSearch(''), {
        wrapper: withMocks([
          {
            request: {
              query: ArticleListDocument,
              variables: articleSearchVariables(),
            },
            result: {
              data: {
                articles: connection(
                  'PaginatedArticles',
                  [articleNode('a1', 'First')],
                  { endCursor: 'a1', hasNextPage: true }
                ),
              },
            },
          },
          {
            request: {
              query: ArticleListDocument,
              variables: { ...articleSearchVariables(), cursor: 'a1', skip: 1 },
            },
            result: {
              data: {
                articles: connection(
                  'PaginatedArticles',
                  [articleNode('a2', 'Second')],
                  { endCursor: 'a2', hasNextPage: false }
                ),
              },
            },
          },
        ]),
      });

      await waitFor(() => expect(result.current.hasMore).toBe(true));

      act(() => {
        result.current.loadMore();
      });

      await waitFor(() =>
        expect(result.current.options.map(option => option.id)).toEqual([
          'a1',
          'a2',
        ])
      );
      expect(result.current.hasMore).toBe(false);
    });

    it('does not query while skipped', () => {
      const { result } = renderHook(
        () => recordSources.article.useSearch('', { skip: true }),
        { wrapper: withMocks([]) }
      );

      expect(result.current.options).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it('resolves the selected articles with one request by ids, whatever their order', async () => {
      const { result } = renderHook(
        () => recordSources.article.useRecords(['a2', 'a1']),
        {
          wrapper: withMocks([
            {
              request: {
                query: ArticleListDocument,
                variables: {
                  filter: { ids: ['a1', 'a2'], includeHidden: true },
                  take: 2,
                },
              },
              result: {
                data: {
                  articles: connection('PaginatedArticles', [
                    articleNode('a1', 'First'),
                    articleNode('a2', 'Second', { state: 'pending' }),
                  ]),
                },
              },
            },
          ]),
        }
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.records['a1']?.title).toBe('First');
      expect(result.current.records['a2']?.status).toBe('pending');
    });
  });

  describe('page', () => {
    it('searches by title', async () => {
      const { result } = renderHook(
        () => recordSources.page.useSearch('about'),
        {
          wrapper: withMocks([
            {
              request: {
                query: PageListDocument,
                variables: pageSearchVariables('about'),
              },
              result: {
                data: {
                  pages: connection('PaginatedPages', [
                    pageNode('p1', 'About us'),
                  ]),
                },
              },
            },
          ]),
        }
      );

      await waitFor(() => expect(result.current.options).toHaveLength(1));

      expect(result.current.options[0]).toEqual({
        id: 'p1',
        title: 'About us',
        subtitle: '/p1',
        imageUrl: undefined,
        status: 'published',
      });
    });

    it('resolves the selected pages one by one', async () => {
      const fullPage = (id: string, title: string) => {
        const node = pageNode(id, title, 'draft');

        return { ...node, latest: { ...node.latest, blocks: [] } };
      };

      const { result } = renderHook(
        () => recordSources.page.useRecords(['p1', 'p2']),
        {
          wrapper: withMocks([
            {
              request: { query: PageDocument, variables: { id: 'p1' } },
              result: { data: { page: fullPage('p1', 'Home') } },
            },
            {
              request: { query: PageDocument, variables: { id: 'p2' } },
              result: { data: { page: fullPage('p2', 'Contact') } },
            },
          ]),
        }
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.records['p1']).toMatchObject({
        title: 'Home',
        status: 'draft',
      });
      expect(result.current.records['p2']?.title).toBe('Contact');
    });
  });

  describe('memberPlan', () => {
    it('filters the plans by name on the client', async () => {
      const { result } = renderHook(
        () => recordSources.memberPlan.useSearch('abo'),
        {
          wrapper: withMocks([
            {
              request: {
                query: MemberPlanListDocument,
                variables: {
                  take: 100,
                  sort: MemberPlanSort.CreatedAt,
                  order: SortOrder.Ascending,
                },
              },
              result: {
                data: {
                  memberPlans: connection('PaginatedMemberPlans', [
                    memberPlanNode('m1', 'Jahres-Abo'),
                    memberPlanNode('m2', 'Gönner'),
                  ]),
                },
              },
            },
          ]),
        }
      );

      await waitFor(() => expect(result.current.options).toHaveLength(1));

      expect(result.current.options[0]).toMatchObject({
        id: 'm1',
        title: 'Jahres-Abo',
      });
      expect(result.current.hasMore).toBe(false);
    });
  });
});
