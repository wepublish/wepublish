import { generateSitemap } from '@wepublish/feed/website';
import { getApiUrl } from '@wepublish/utils/website';
import {
  ArticleListDocument,
  ArticleListQueryVariables,
  ArticleSort,
  getApiClient,
  PageListDocument,
  PageListQueryVariables,
  PageSort,
  SortOrder,
} from '@wepublish/website/api';
import { NextApiRequest } from 'next';
import process from 'node:process';

export const getSitemap = async (req: NextApiRequest): Promise<string> => {
  const siteUrl = process.env.WEBSITE_URL || '';

  const generate = generateSitemap({
    siteUrl,
    title: 'Cültür',
  });
  const client = getApiClient(getApiUrl(), [], {
    typePolicies: {},
  });

  const [{ data: articleData }, { data: pageData }] = await Promise.all([
    client.query({
      query: ArticleListDocument,
      variables: {
        take: 50,
        sort: ArticleSort.PublishedAt,
        order: SortOrder.Descending,
      } as ArticleListQueryVariables,
    }),
    client.query({
      query: PageListDocument,
      variables: {
        take: 100,
        sort: PageSort.PublishedAt,
        order: SortOrder.Descending,
      } as PageListQueryVariables,
    }),
  ]);

  return generate(
    articleData.articles.nodes ?? [],
    pageData.pages.nodes ?? [],
    [`${siteUrl}/author`, `${siteUrl}/event`]
  );
};
