import { CombinedGraphQLErrors } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  ArticleContainer,
  ArticleListContainer,
  ArticleWrapper,
} from '@wepublish/article/website';
import { CommentListContainer } from '@wepublish/comments/website';
import { getApiUrl, revalidateFor } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  ArticleDocument,
  ArticleListDocument,
  CommentItemType,
  CommentListDocument,
  FullTagFragment,
  getApiClient,
  NavigationListDocument,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { ComponentProps } from 'react';

export default function ArticleBySlugOrId() {
  const {
    query: { slug, id },
  } = useRouter();
  const {
    elements: { H3 },
  } = useWebsiteBuilder();

  const { data } = useQuery(ArticleDocument, {
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
          <H3 component={'h2'}>Das könnte dich auch interessieren</H3>

          <ArticleListContainer
            variables={{
              filter: { tags: data.article.tags.map(tag => tag.id) },
              take: 4,
            }}
            filter={articles =>
              articles
                .filter(article => article.id !== data.article?.id)
                .splice(0, 3)
            }
          />
        </ArticleWrapper>
      )}

      {data?.article && !data?.article?.disableComments && (
        <ArticleWrapper>
          <H3 component={'h2'}>Kommentare</H3>
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
  const id = params?.id?.toString();
  const slug = params?.slug?.toString();
  const client = getApiClient(getApiUrl(), []);

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

  const is404 =
    CombinedGraphQLErrors.is(article.error) &&
    article.error.errors.find(({ extensions }) => extensions?.status === 404);

  if (is404) {
    return {
      notFound: true,
      revalidate: 1,
    };
  }

  if (article.data?.article) {
    await Promise.all([
      client.query({
        query: ArticleListDocument,
        variables: {
          filter: {
            tags: article.data.article.tags.map(
              (tag: FullTagFragment) => tag.id
            ),
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

  const props = addClientCacheToProps(client, {});

  return {
    props,
    revalidate: revalidateFor(article.data?.article, article.error),
  };
};
