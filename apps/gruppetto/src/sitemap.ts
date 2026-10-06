import { generateSitemap } from '@wepublish/feed/website';
import { createSsrClient } from '@wepublish/utils/website/tanstack/server';
import {
  ArticleListDocument,
  ArticleListQueryVariables,
  ArticleSort,
  PageListDocument,
  PageListQueryVariables,
  PageSort,
  SortOrder,
} from '@wepublish/website/api';

/** Port of `apps/gruppetto/src/sitemap.ts`. */
export const getSitemap = async (siteUrl: string): Promise<string> => {
  const generate = generateSitemap({ siteUrl, title: 'Gruppetto' });
  const client = createSsrClient();

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
    articleData?.articles.nodes ?? [],
    pageData?.pages.nodes ?? [],
    [
      `${siteUrl}/author`,
      `${siteUrl}/login`,
      `${siteUrl}/signup`,
      `${siteUrl}/abo`,
    ]
  );
};
