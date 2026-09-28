import { ArticleContainer } from '@wepublish/article/website';
import { getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  ArticleDocument,
  ArticleListDocument,
  getApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  Tag,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { ComponentProps } from 'react';

export default function ArticleBySlugOrId() {
  const {
    query: { slug, id },
  } = useRouter();

  const containerProps = {
    slug,
    id,
  } as ComponentProps<typeof ArticleContainer>;

  return <ArticleContainer {...containerProps} />;
}

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { id, slug } = params || {};
  const client = getApiClient(getApiUrl(), []);

  const [article] = await Promise.all([
    client.query({
      query: ArticleDocument,
      variables: { id, slug },
    }),
    client.query({ query: NavigationListDocument }),
    client.query({ query: PeerProfileDocument }),
  ]);

  const is404 = article.errors?.find(
    ({ extensions }) => extensions?.status === 404
  );

  if (is404) {
    return { notFound: true, revalidate: 1 };
  }

  if (article.data?.article) {
    await client.query({
      query: ArticleListDocument,
      variables: {
        filter: {
          tags: article.data.article.tags.map((tag: Tag) => tag.id),
        },
        take: 4,
      },
    });
  }

  const props = addClientCacheToProps(client, {});

  return {
    props,
    revalidate: 60,
  };
};
