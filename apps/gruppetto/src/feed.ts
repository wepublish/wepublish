import { generateFeed } from '@wepublish/feed/website';
import { createSsrClient } from '@wepublish/utils/website/tanstack/server';
import {
  ArticleListDocument,
  ArticleListQueryVariables,
  ArticleSort,
  SortOrder,
} from '@wepublish/website/api';

/**
 * Port of `apps/gruppetto/src/feed.ts`. Took a `NextApiRequest`; now takes the
 * plain `Request` URL that the TanStack server route handler receives.
 */
export const getFeed = async (requestUrl: string, siteUrl: string) => {
  const { pathname, search } = new URL(requestUrl);
  const self = `${siteUrl}${pathname}${search}`;

  const generate = await generateFeed({
    id: self,
    link: self,
    title: 'We.Publish',
    ttl: 10, // in minutes
    copyright: 'We.Publish',
    categories: ['OSS', 'CMS', 'Journalism'],
    updated: new Date(),
    feedLinks: {
      json: `${siteUrl}/feed.json`,
      atom: `${siteUrl}/atom.xml`,
      rss: `${siteUrl}/rss.xml`,
    },
  });

  const client = createSsrClient();

  const { data } = await client.query({
    query: ArticleListDocument,
    variables: {
      take: 50,
      sort: ArticleSort.PublishedAt,
      order: SortOrder.Descending,
    } as ArticleListQueryVariables,
  });

  return generate(data?.articles.nodes ?? []);
};
