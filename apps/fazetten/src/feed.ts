import { generateFeed } from '@wepublish/feed/website';
import { getApiUrl } from '@wepublish/utils/website';
import { SortOrder } from '@wepublish/website/api';
import {
  ArticleListDocument,
  ArticleListQueryVariables,
  ArticleSort,
  getV1ApiClient,
} from '@wepublish/website/api';
import { NextApiRequest } from 'next';
import process from 'node:process';

export const getFeed = async (req: NextApiRequest) => {
  const siteUrl = process.env.WEBSITE_URL || '';

  const generate = await generateFeed({
    id: `${siteUrl + req.url}`,
    link: siteUrl,
    title: 'Fazetten',
    ttl: 10, // in minutes
    copyright: 'Fazetten',
    categories: ['OSS', 'CMS', 'Journalism'],
    updated: new Date(),
    feedLinks: {
      json: `${siteUrl + req.url}/api/json-feed`,
      atom: `${siteUrl + req.url}/api/atom-feed`,
      rss: `${siteUrl + req.url}/api/rss-feed`,
    },
  });
  const client = getV1ApiClient(getApiUrl(), [], {
    typePolicies: {},
  });

  const { data } = await client.query({
    query: ArticleListDocument,
    variables: {
      take: 50,
      sort: ArticleSort.PublishedAt,
      order: SortOrder.Descending,
    } as ArticleListQueryVariables,
  });

  return generate(data.articles.nodes ?? []);
};
