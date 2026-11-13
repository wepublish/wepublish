import { generateFeed, queryFeed } from '@wepublish/feed/website';
import { createSsrClient } from '@wepublish/utils/website/tanstack/server';
import { ArticleSort, SortOrder } from '@wepublish/website/api';

/**
 * Port of the Next `apps/factuel/src/feed.ts`. Took a `NextApiRequest`; now takes the
 * plain `Request` URL that the TanStack server route handler receives.
 */
export const getFeed = async (requestUrl: string, siteUrl: string) => {
  const { pathname, search } = new URL(requestUrl);
  const self = `${siteUrl}${pathname}${search}`;

  const generate = await generateFeed({
    id: self,
    link: siteUrl,
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

  const { articles, options } = await queryFeed(client, {
    take: 50,
    sort: ArticleSort.PublishedAt,
    order: SortOrder.Descending,
  });

  return generate(articles, options);
};
