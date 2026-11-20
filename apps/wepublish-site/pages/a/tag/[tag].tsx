import { useQuery } from '@apollo/client/react';
import { PageContainer } from '@wepublish/page/website';
import { getApiUrl, prefetchPageForTag } from '@wepublish/utils/website';
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

  const pageId = tagData.data?.tag?.pageId;

  const articles = useQuery(ArticleListDocument, {
    skip: !tagData.data?.tag?.id || !!pageId,
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

  // An editor chose a page to show instead of the tag's articles.
  if (pageId) {
    return (
      <PageContainer
        id={pageId}
        className={className}
      />
    );
  }

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
    tag: tag as string,
    ...(pageForTag && { shell: pageForTag.shell }),
  });

  return {
    props,
    revalidate: 60,
  };
}) satisfies GetStaticProps;
