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

import { isArchived, isNachtleben } from './archiviert';

export const getSitemap = async (req: NextApiRequest): Promise<string> => {
  const siteUrl = process.env.WEBSITE_URL || '';

  const generate = generateSitemap({
    siteUrl,
    title: 'Hauptstadt',
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

  // archived articles (/archive/…) are disallowed in robots.txt and nachtleben
  // article urls permanently redirect to /ausgang-in-bern — neither belongs
  // in the sitemap
  const articles = (articleData.articles.nodes ?? []).filter(
    (article: { tags: { tag?: string | null }[] }) =>
      !isArchived(article.tags) && !isNachtleben(article.tags)
  );

  return generate(articles, pageData.pages.nodes ?? [], [
    `${siteUrl}/author`,
    `${siteUrl}/event`,
    `${siteUrl}/login`,
    `${siteUrl}/signup`,
    `${siteUrl}/mitmachen`,
    `${siteUrl}/ausgang-in-bern`,
  ]);
};
