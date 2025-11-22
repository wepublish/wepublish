import styled from '@emotion/styled';
import {
  ArticleContainer,
  ArticleListContainer,
} from '@wepublish/article/website';
import { CommentListContainer } from '@wepublish/comments/website';
import {
  addClientCacheToV1Props,
  ArticleDocument,
  ArticleListDocument,
  ArticleSort,
  CommentItemType,
  CommentListDocument,
  getV1ApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  SortOrder,
  Tag,
  TagListDocument,
  TagType,
  useArticleQuery,
  useTagListQuery,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { ComponentProps } from 'react';

const nrOfRecentArticles = 4;
const excludeTags = ['Gelesen & gedacht', 'RückSpiegel'];

export const ArticleWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-column: 1/12;
  }
`;

export default function ArticleBySlugOrId() {
  const {
    query: { slug, id },
  } = useRouter();
  const {
    elements: { H2 },
  } = useWebsiteBuilder();

  const { data } = useArticleQuery({
    fetchPolicy: 'cache-only',
    variables: {
      slug: slug as string,
      id: id as string,
    },
  });

  const tags = useTagListQuery({
    fetchPolicy: 'cache-only',
    variables: {
      filter: {
        tags: excludeTags,
        type: TagType.Article,
      },
    },
  });

  const containerProps = {
    slug,
    id,
  } as ComponentProps<typeof ArticleContainer>;

  return (
    <>
      <ArticleContainer {...containerProps} />

      {data?.article && tags.data && (
        <ArticleWrapper>
          <H2 component={'h2'}>Aktuelle Beiträge</H2>

          <ArticleListContainer
            variables={{
              sort: ArticleSort.PublishedAt,
              order: SortOrder.Descending,
              take: nrOfRecentArticles + 1,
              filter: {
                tagsNotIn: tags.data.tags.nodes.map((tag: Tag) => tag.id),
              },
            }}
            filter={articles =>
              articles
                .filter(article => article.id !== data.article.id)
                .splice(0, nrOfRecentArticles)
            }
          />
          <div id={'comments'} />
        </ArticleWrapper>
      )}

      {data?.article && !data.article.disableComments && (
        <ArticleWrapper>
          <H2 component={'h2'}>Kommentare</H2>
          <CommentListContainer
            id={data!.article!.id}
            type={CommentItemType.Article}
          />
        </ArticleWrapper>
      )}
    </>
  );
}

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { id, slug } = params || {};
  const { publicRuntimeConfig } = getConfig();

  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, []);

  const [article] = await Promise.all([
    client.query({
      query: ArticleDocument,
      variables: {
        id,
        slug,
      },
    }),
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
  ]);

  const is404 = article.errors?.find(
    ({ extensions }) => extensions?.status === 404
  );

  if (is404) {
    return {
      notFound: true,
      revalidate: 1,
    };
  }

  if (article.data?.article) {
    const tagsToExclude = await client.query({
      query: TagListDocument,
      variables: {
        filter: {
          tags: excludeTags,
          type: TagType.Article,
        },
      },
    });

    await Promise.all([
      client.query({
        query: ArticleListDocument,
        variables: {
          sort: ArticleSort.PublishedAt,
          order: SortOrder.Descending,
          take: nrOfRecentArticles + 1,
          filter: {
            tagsNotIn:
              tagsToExclude.data ?
                tagsToExclude.data.tags.nodes.map((tag: Tag) => tag.id)
              : [],
          },
        },
      }),
      client.query({
        query: CommentListDocument,
        variables: {
          itemId: article.data.article.id,
        },
      }),
    ]);
  }

  const props = addClientCacheToV1Props(client, {});

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
