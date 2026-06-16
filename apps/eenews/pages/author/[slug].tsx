import { AuthorContainer } from '@wepublish/author/website';
import { getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  ArticleListDocument,
  AuthorDocument,
  AuthorQuery,
  getApiClient,
  NavigationListDocument,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';

const AUTHOR_ARTICLES_PER_PAGE = 12;

export default function EenewsAuthorPage() {
  const {
    query: { slug },
  } = useRouter();

  if (typeof slug !== 'string') {
    return null;
  }

  return <AuthorContainer slug={slug} />;
}

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params || {};
  if (typeof slug !== 'string') {
    return { notFound: true, revalidate: 1 };
  }

  const client = getApiClient(getApiUrl(), []);

  const [author] = await Promise.all([
    client.query<AuthorQuery>({
      query: AuthorDocument,
      variables: { slug },
    }),
    client.query({ query: NavigationListDocument }),
    client.query({ query: PeerProfileDocument }),
  ]);

  const is404 = author.errors?.find(
    ({ extensions }) => extensions?.status === 404
  );
  if (is404) {
    return { notFound: true, revalidate: 1 };
  }

  if (author.data?.author?.id) {
    await client.query({
      query: ArticleListDocument,
      variables: {
        filter: { authors: [author.data.author.id] },
        take: AUTHOR_ARTICLES_PER_PAGE,
        skip: 0,
      },
    });
  }

  const props = addClientCacheToProps(client, {});

  return {
    props,
    revalidate: 60,
  };
};
