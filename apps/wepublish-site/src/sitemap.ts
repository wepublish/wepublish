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

import { locales, localizeUrl } from './localize-url';

export const getSitemap = async (req: NextApiRequest): Promise<string> => {
  const siteUrl = process.env.WEBSITE_URL || '';

  const generate = generateSitemap({
    siteUrl,
    title: 'We.Publish',
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

  const articles = (articleData.articles.nodes ?? []).map(
    (article: Article) => ({
      ...article,
      url: localizeUrl(siteUrl, article.slug, 'article'),
    })
  );
  const pages = (pageData.pages.nodes ?? []).map((page: Page) => ({
    ...page,
    url: localizeUrl(siteUrl, page.slug, 'page'),
  }));
  const staticPaths = ['/author', '/event', '/login', '/signup', '/mitmachen'];

  return generate(
    articles,
    pages,
    locales.flatMap(locale =>
      staticPaths.map(path => `${siteUrl}/${locale}${path}`)
    )
  );
};
