import { generateFeed, queryFeed } from '@wepublish/feed/website';
import { getApiUrl } from '@wepublish/utils/website';
import { ArticleSort, getApiClient, SortOrder } from '@wepublish/website/api';
import { NextApiRequest } from 'next';
import process from 'node:process';

import { localizeUrl } from './localize-url';

export const getFeed = async (req: NextApiRequest) => {
  const siteUrl = process.env.WEBSITE_URL || '';

  const generate = await generateFeed({
    id: `${siteUrl + req.url}`,
    link: `${siteUrl}/de`,
    title: 'We.Publish',
    ttl: 10, // in minutes
    copyright: 'We.Publish',
    categories: ['OSS', 'CMS', 'Journalism'],
    updated: new Date(),
    feedLinks: {
      json: `${siteUrl + req.url}/api/json-feed`,
      atom: `${siteUrl + req.url}/api/atom-feed`,
      rss: `${siteUrl + req.url}/api/rss-feed`,
    },
  });
  const client = getApiClient(getApiUrl(), [], {
    typePolicies: {},
  });

  const { articles, options } = await queryFeed(client, {
    take: 50,
    sort: ArticleSort.PublishedAt,
    order: SortOrder.Descending,
  });

  const localized = articles.map(article => ({
    ...article,
    url: localizeUrl(siteUrl, article.slug, 'article'),
  }));

  return generate(localized, options);
};
