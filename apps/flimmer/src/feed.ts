import { getApiUrl } from '@wepublish/utils/website';
import {
  ArticleListDocument,
  ArticleListQueryVariables,
  ArticleSort,
  getV1ApiClient,
  SortOrder,
} from '@wepublish/website/api';
import { generateFeed } from '@wepublish/website/server';
import { NextApiRequest } from 'next';
import process from 'node:process';

export const getFeed = async (req: NextApiRequest) => {
  const siteUrl = process.env.WEBSITE_URL || '';

  const generate = await generateFeed({
    id: `${siteUrl + req.url}`,
    link: siteUrl,
    title: 'Flimmer',
    ttl: 10, // in minutes
    copyright: 'Flimmer',
    categories: ['Zuerich', 'Journalism'],
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
