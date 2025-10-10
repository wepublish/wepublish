import {
  ArticleRecent,
  ArticleRecentWrapper,
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
  Tag,
  TagListDocument,
  TagType,
  useArticleQuery,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';

const nrOfRecentArticles = 4;
const excludeTags = ['Gelesen & gedacht'];
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

  return (
    <>
      {data?.article && (
        <ArticleRecent
          article={data.article}
          excludeTags={excludeTags}
          nrOfRecentArticles={nrOfRecentArticles}
        />
      )}

      {data?.article && !data.article.disableComments && (
        <ArticleRecentWrapper>
          <H2 component={'h2'}>Kommentare</H2>
          <CommentListContainer
            id={data!.article!.id}
            type={CommentItemType.Article}
          />
        </ArticleRecentWrapper>
      )}
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
    const tagsToExclude = await client.query({
      query: TagListDocument,
      variables: {
        type: TagType.Article,
        filter: {
          tags: excludeTags,
        },
        take: 100,
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
    revalidate: !article.data?.article ? 1 : 60, // every 60 seconds
  };
};
