import { ArticleListQuery } from '@wepublish/website/api';
import { definedOnly } from './overrides';

type PageInfo = ArticleListQuery['articles']['pageInfo'];

export const mockPageInfo = (overrides: Partial<PageInfo> = {}): PageInfo => ({
  __typename: 'PageInfo',
  startCursor: null,
  endCursor: null,
  hasNextPage: false,
  hasPreviousPage: false,
  ...definedOnly(overrides),
});

export const mockPaginated = <
  Typename extends `Paginated${string}`,
  Node extends { id: string },
>(
  __typename: Typename,
  nodes: Node[],
  {
    totalCount = nodes.length,
    pageInfo = {},
  }: { totalCount?: number; pageInfo?: Partial<PageInfo> } = {}
) => ({
  __typename,
  nodes,
  totalCount,
  pageInfo: mockPageInfo({
    startCursor: nodes[0]?.id ?? null,
    endCursor: nodes[nodes.length - 1]?.id ?? null,
    ...pageInfo,
  }),
});
