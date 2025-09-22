import styled from '@emotion/styled';
import {
  ArticleContainer,
  ArticleListContainer,
} from '@wepublish/article/website';
import { CommentListContainer } from '@wepublish/comments/website';
import { getArticlePathsBasedOnPage } from '@wepublish/utils/website';
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
  useArticleQuery,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { ComponentProps } from 'react';

import { Advertisement } from '../../src/components/advertisement';

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

  const containerProps = {
    slug,
    id,
  } as ComponentProps<typeof ArticleContainer>;

  return (
    <>
      <ArticleContainer {...containerProps} />

      {data?.article && (
        <ArticleWrapper>
          <H2 component={'h2'}>Aktuelle Beiträge</H2>

          <ArticleListContainer
            variables={{
              sort: ArticleSort.PublishedAt,
              order: SortOrder.Descending,
              take: 5,
            }}
            filter={articles =>
              articles
                .filter(article => article.id !== data.article?.id)
                .splice(0, 4)
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
      <Advertisement type={'small'} />
    </>
  );
}

export const getStaticPaths = getArticlePathsBasedOnPage('');

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
    };
  }

  if (article.data?.article) {
    await Promise.all([
      client.query({
        query: ArticleListDocument,
        variables: {
          filter: {
            tags: article.data.article.tags.map((tag: Tag) => tag.id),
          },
          take: 4,
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
    revalidate: !article.data?.article ? 1 : 60, // every 60 seconds
  };
};
