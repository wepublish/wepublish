import { TagContainer } from '@wepublish/tag/website';
import {
  ArticleListDocument,
  NavigationListDocument,
  PeerProfileDocument,
  TagDocument,
  TagType,
  addClientCacheToProps,
  getApiClient,
} from '@wepublish/website/api';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useRouter } from 'next/router';
import { z } from 'zod';

import { getApiUrl } from '../../lib/api-url';
import { prefetchPageForTag } from '../../lib/page-for-tag';

const take = 25;

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional().default(1),
});

export function TagPage({
  tag,
  className,
}: InferGetStaticPropsType<typeof TagPageGetStaticProps> & {
  className?: string;
}) {
  const { query, replace } = useRouter();
  const { page } = pageSchema.parse(query);

  return (
    <TagContainer
      className={className}
      tag={tag}
      type={TagType.Article}
      variables={{ take, skip: (page - 1) * take }}
      onVariablesChange={variables => {
        replace(
          {
            query: {
              ...query,
              page: variables?.skip ? variables.skip / take + 1 : 1,
            },
          },
          undefined,
          { shallow: true, scroll: true }
        );
      }}
    />
  );
}

export const TagPageGetStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});

export const TagPageGetStaticProps = (async ({ params }) => {
  const tag = params!.tag!.toString();
  const client = getApiClient(getApiUrl(), []);

  const tagResult = await client.query({
    query: TagDocument,
    variables: {
      tag,
      type: TagType.Article,
    },
  });

  if (tagResult.error || !tagResult.data?.tag) {
    return {
      notFound: true,
      revalidate: 1,
    };
  }

  const pageTag = tagResult.data.tag;

  // The page an editor chose for the tag, or else the tag's articles.
  const prefetchContent = async () => {
    const pageForTag = await prefetchPageForTag(client, pageTag);

    if (!pageForTag) {
      await client.query({
        query: ArticleListDocument,
        variables: {
          take,
          skip: 0,
          filter: {
            tags: [pageTag.id],
          },
        },
      });
    }

    return pageForTag;
  };

  const [pageForTag] = await Promise.all([
    prefetchContent(),
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
  ]);

  const props = addClientCacheToProps(client, {
    tag,
    ...(pageForTag && { shell: pageForTag.shell }),
  });

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
}) satisfies GetStaticProps;
