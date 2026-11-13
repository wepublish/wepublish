import { generateFeed, queryFeed } from '@wepublish/feed/website';
import { getApiUrl } from '@wepublish/utils/website';
import { ArticleSort, SortOrder, getApiClient } from '@wepublish/website/api';
import { Feed } from 'feed';
import { NextApiRequest } from 'next';
import process from 'node:process';

export const getFeed = async (req: NextApiRequest): Promise<Feed> => {
  const siteUrl = process.env.WEBSITE_URL || '';

  const generate = await generateFeed({
    id: `${siteUrl + req.url}`,
    link: siteUrl,
    title: 'Bajour',
    ttl: 10, // in minutes
    copyright: 'Bajour.ch',
    categories: ['Bajour', 'CMS', 'Journalism', 'Journalismus', 'Basel'],
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

  return generate(articles, options);
};
