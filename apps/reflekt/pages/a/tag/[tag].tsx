import { TagContainer } from '@wepublish/tag/website';
import { getApiUrl } from '@wepublish/utils/website';
import { TagType } from '@wepublish/website/api';
import {
  addClientCacheToV1Props,
  ArticleListDocument,
  getV1ApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  TagDocument,
} from '@wepublish/website/api';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useRouter } from 'next/router';
import { z } from 'zod';

const take = 50;

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional().default(1),
});

export default function TagPage({
  tag,
  className,
}: InferGetStaticPropsType<typeof getStaticProps> & {
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

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});

export const getStaticProps = (async ({ params }) => {
  const { tag } = params || {};
  const client = getV1ApiClient(getApiUrl(), []);

  const tagResult = await client.query({
    query: TagDocument,
    variables: {
      tag,
      type: TagType.Article,
    },
  });

  if (tagResult.error || !tagResult.data.tag) {
    return {
      notFound: true,
      revalidate: 1,
    };
  }

  const tagId = tagResult.data.tag.id;

  await Promise.all([
    client.query({
      query: ArticleListDocument,
      variables: {
        take,
        skip: 0,
        filter: {
          tags: [tagId],
        },
      },
    }),
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
  ]);

  const props = addClientCacheToV1Props(client, {
    tag: tag as string,
  });

  return {
    props,
    revalidate: 60,
  };
}) satisfies GetStaticProps;
