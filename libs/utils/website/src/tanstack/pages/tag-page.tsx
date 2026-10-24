import { ApolloClient } from '@apollo/client';
import { TagContainer } from '@wepublish/tag/website';
import {
  ArticleListDocument,
  TagDocument,
  TagType,
} from '@wepublish/website/api';
import { z } from 'zod';

import { useQueryParams, useReplaceSearch } from '../router-hooks';

const take = 25;

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional().default(1),
  tag: z.string(),
});

/**
 * TanStack port of `TagPageGetStaticProps`. Returns `null` when the tag does
 * not exist so the route can answer with a 404 — Next returned
 * `{ notFound: true, revalidate: 1 }` here.
 */
export const prefetchTag = async (
  client: ApolloClient,
  { tag }: { tag: string }
) => {
  const tagResult = await client.query({
    query: TagDocument,
    variables: { tag, type: TagType.Article },
  });

  if (tagResult.error || !tagResult.data?.tag) {
    return null;
  }

  await client.query({
    query: ArticleListDocument,
    variables: {
      take,
      skip: 0,
      filter: { tags: [tagResult.data.tag.id] },
    },
  });

  return tagResult.data.tag;
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
