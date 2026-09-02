import { getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  ArticleDocument,
  ArticleListDocument,
  CommentListDocument,
  getApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  Tag,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';

import { isArchived } from '../../src/archiviert';
import { StandaloneArticlePage } from '../../src/components/standalone-article-page';

export default function ArchivedArticleBySlug() {
  const {
    query: { slug },
  } = useRouter();

  return <StandaloneArticlePage slug={slug as string} />;
}

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params || {};
  const client = getApiClient(getApiUrl(), []);

  const [article] = await Promise.all([
    client.query({
      query: ArticleDocument,
      variables: {
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

  // only archived articles live under /arch — everything else keeps its
  // canonical /a/<slug> url
  if (article.data?.article && !isArchived(article.data.article.tags)) {
    return {
      redirect: {
        destination: `/a/${article.data.article.slug}`,
        permanent: false,
      },
      revalidate: 60,
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

  const props = addClientCacheToProps(client, {});

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
