import { ApolloClient } from '@apollo/client';
import { createServerFn } from '@tanstack/react-start';
import { TagContainer } from '@wepublish/tag/website';
import {
  ArticleListDocument,
  TagDocument,
  TagQuery,
  TagType,
} from '@wepublish/website/api';
import { z } from 'zod';

import { prefetchPageForTag } from '../../lib/page-for-tag';
import { WebsiteShell } from '../../lib/website-shell';
import { useQueryParams, useReplaceSearch } from '../router-hooks';
import { runContentQueries } from '../ssr';

const take = 25;

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional().default(1),
  tag: z.string(),
});

/** Server-side half of the tag loader. See `runContentQueries`. */
export const loadTag = createServerFn({ method: 'GET' })
  .validator((data: { tag: string }) => data)
  .handler(async ({ data }) => {
    let found = false;
    let shell: WebsiteShell | undefined;

    const apollo = await runContentQueries(async client => {
      const result = await prefetchTag(client, data);

      found = !!result;
      shell = result?.shell;

      return result?.content ?? null;
    });

    return { apollo, found, shell };
  });

/**
 * TanStack port of `TagPageGetStaticProps`. Returns `null` when the tag does
 * not exist so the route can answer with a 404 — Next returned
 * `{ notFound: true, revalidate: 1 }` here. `content` is what the page shows
 * (the tag, or the page chosen for it), for the cache window.
 */
export const prefetchTag = async (
  client: ApolloClient,
  { tag }: { tag: string }
): Promise<{
  tag: NonNullable<TagQuery['tag']>;
  content: unknown;
  shell?: WebsiteShell;
} | null> => {
  const tagResult = await client.query({
    query: TagDocument,
    variables: { tag, type: TagType.Article },
  });

  if (tagResult.error || !tagResult.data?.tag) {
    return null;
  }

  const pageForTag = await prefetchPageForTag(client, tagResult.data.tag);

  if (pageForTag) {
    return {
      tag: tagResult.data.tag,
      content: pageForTag.page,
      shell: pageForTag.shell,
    };
  }

  await client.query({
    query: ArticleListDocument,
    variables: {
      take,
      skip: 0,
      filter: { tags: [tagResult.data.tag.id] },
    },
  });

  return { tag: tagResult.data.tag, content: tagResult.data.tag };
};

/** TanStack port of `TagPage`. */
export function TagPage({ className }: { className?: string }) {
  const replaceSearch = useReplaceSearch();
  const { page, tag } = pageSchema.parse(useQueryParams());

  return (
    <TagContainer
      className={className}
      tag={tag}
      type={TagType.Article}
      variables={{ take, skip: (page - 1) * take }}
      onVariablesChange={variables => {
        replaceSearch(previous => ({
          ...previous,
          page: variables?.skip ? variables.skip / take + 1 : 1,
        }));
      }}
    />
  );
}
