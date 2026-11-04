import { createFileRoute } from '@tanstack/react-router';
import { TagContainer } from '@wepublish/tag/website';
import {
  ApolloRouterContext,
  bailOutNotFound,
  FourOhFourPage,
  mergeApolloCache,
  pageSearchSchema,
  useQueryParams,
  useReplaceSearch,
} from '@wepublish/utils/website/tanstack';
import { TagType } from '@wepublish/website/api';
import { z } from 'zod';

import { loadEenewsTag, TAG_TAKE } from '../../../integration/tag-queries';

const paramsSchema = z.object({
  page: z.coerce.number().gte(1).optional().default(1),
  tag: z.string(),
});

/** `pages/a/tag/[tag].tsx` */
export const Route = createFileRoute('/a/tag/$tag')({
  validateSearch: pageSearchSchema,
  loader: async ({
    context,
    params: { tag },
  }: {
    context: ApolloRouterContext;
    params: { tag: string };
  }) => {
    const { apollo, found } = await loadEenewsTag({ data: { tag } });

    mergeApolloCache(context.apolloClient, apollo);

    if (!found) {
      await bailOutNotFound(context);
    }
  },
  component: EenewsTag,
  notFoundComponent: FourOhFourPage,
});

function EenewsTag() {
  const replaceSearch = useReplaceSearch();
  const { page, tag } = paramsSchema.parse(useQueryParams());

  return (
    <TagContainer
      tag={tag}
      type={TagType.Article}
      variables={{ take: TAG_TAKE, skip: (page - 1) * TAG_TAKE }}
      onVariablesChange={variables => {
        replaceSearch(previous => ({
          ...previous,
          page: variables?.skip ? variables.skip / TAG_TAKE + 1 : 1,
        }));
      }}
    />
  );
}
