import { useQuery } from '@apollo/client/react';
import { getApiUrl } from '@wepublish/utils/website';
import {
  ArticleListDocument,
  NavigationListDocument,
  PeerProfileDocument,
  TagDocument,
  TagType,
  addClientCacheToProps,
  getApiClient,
} from '@wepublish/website/api';
import { Tag } from '@wepublish/website/builder';
import { produce } from 'immer';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { z } from 'zod';

const take = 25;

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional().default(1),
});

export default function TagPage({
  tag,
  className,
}: InferGetStaticPropsType<typeof getStaticProps> & {
  className?: string;
}) {
  const { query, replace, locale } = useRouter();
  const { page } = pageSchema.parse(query);

  const variables = { take, skip: (page - 1) * take };

  const tagData = useQuery(TagDocument, {
    variables: {
      tag,
      type: TagType.Article,
    },
  });

  const articles = useQuery(ArticleListDocument, {
    skip: !tagData.data?.tag?.id,
    variables: {
      ...variables,
      filter: {
        tags: tagData.data?.tag ? [tagData.data.tag.id] : [],
      },
    },
  });

  const localizedArticles = useMemo(
    () => ({
      data: produce(articles.data, draft => {
        if (draft?.articles) {
          draft.articles.nodes = draft.articles.nodes.filter(article =>
            article.slug?.endsWith(`-${locale}`)
          );
        }
      }),
      loading: articles.loading,
      error: articles.error,
    }),
    [articles.data, articles.loading, articles.error, locale]
  );

  return (
    <Tag
      className={className}
      tag={tagData}
      articles={localizedArticles}
      variables={variables}
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

  const props = addClientCacheToProps(client, {
    tag: tag as string,
  });

  return {
    props,
    revalidate: 60,
  };
}) satisfies GetStaticProps;
