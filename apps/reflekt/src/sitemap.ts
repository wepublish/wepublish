import { generateSitemap } from '@wepublish/feed/website';
import { getApiUrl } from '@wepublish/utils/website';
import {
  Article,
  ArticleListDocument,
  ArticleListQueryVariables,
  ArticleSort,
  getApiClient,
  Page,
  PageListDocument,
  PageListQueryVariables,
  PageSort,
  SortOrder,
} from '@wepublish/website/api';
import { NextApiRequest } from 'next';
import process from 'node:process';

const apiMaxTake = 100;
const maxEntriesPerType = 500;

type PaginatedNodes<TNode> = {
  nodes: TNode[];
  pageInfo: { hasNextPage: boolean };
};

const fetchUpToSitemapLimit = async <TNode>(
  fetchPage: (
    take: number,
    skip: number
  ) => Promise<PaginatedNodes<TNode> | undefined>
): Promise<TNode[]> => {
  const collected: TNode[] = [];

  while (collected.length < maxEntriesPerType) {
    const take = Math.min(apiMaxTake, maxEntriesPerType - collected.length);
    const paginated = await fetchPage(take, collected.length);
    const nodes = paginated?.nodes ?? [];

    collected.push(...nodes);

    if (nodes.length < take || !paginated?.pageInfo.hasNextPage) {
      break;
    }
  }

  return collected;
};

const firstHeader = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const siteUrlFromRequest = (req: NextApiRequest) => {
  const host = firstHeader(req.headers['x-forwarded-host'] ?? req.headers.host);

  if (!host) {
    return '';
  }

  const protocol =
    firstHeader(req.headers['x-forwarded-proto']) ??
    (host.startsWith('localhost') ? 'http' : 'https');

  return `${protocol}://${host}`;
};

export const getSitemap = async (req: NextApiRequest): Promise<string> => {
  const siteUrl = (
    process.env.WEBSITE_URL || siteUrlFromRequest(req)
  ).replace(/\/$/, '');

  const generate = generateSitemap({
    siteUrl,
    title: 'Reflekt',
    newsMaxAgeDays: 2,
    homepageLastmod: true,
  });
  const client = getApiClient(getApiUrl(), [], {
    typePolicies: {},
  });

  const [articles, pages] = await Promise.all([
    fetchUpToSitemapLimit<Article>(async (take, skip) => {
      const { data } = await client.query({
        query: ArticleListDocument,
        variables: {
          take,
          skip,
          sort: ArticleSort.PublishedAt,
          order: SortOrder.Descending,
        } as ArticleListQueryVariables,
      });

      return data?.articles;
    }),
    fetchUpToSitemapLimit<Page>(async (take, skip) => {
      const { data } = await client.query({
        query: PageListDocument,
        variables: {
          take,
          skip,
          sort: PageSort.PublishedAt,
          order: SortOrder.Descending,
        } as PageListQueryVariables,
      });

      return data?.pages;
    }),
  ]);

  return generate(articles, pages, [
    `${siteUrl}/team`,
    `${siteUrl}/login`,
    `${siteUrl}/signup`,
    `${siteUrl}/mitmachen`,
  ]);
};
