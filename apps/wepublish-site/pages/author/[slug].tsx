import { useQuery } from '@apollo/client/react';
import { CombinedGraphQLErrors } from '@apollo/client';
import { WepAuthorPage } from '@wepublish/tenant/wepublish-site';
import { getApiUrl } from '@wepublish/utils/website';
import {
  ArticleListDocument,
  ArticleListQuery,
  AuthorDocument,
  AuthorQuery,
  NavigationListDocument,
  PeerProfileDocument,
  addClientCacheToProps,
  getApiClient,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { z } from 'zod';

// All articles of the person at once: the language is only in the slug, so
// the page filters and pages them itself
const take = 500;

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional().default(1),
  slug: z.string(),
});

const articleVariables = (authorId?: string) => ({
  take,
  skip: 0,
  filter: { authors: authorId ? [authorId] : [] },
});

export default function AuthorPage() {
  const { query, replace } = useRouter();
  const { page, slug } = pageSchema.parse(query);

  const { data } = useQuery(AuthorDocument, {
    fetchPolicy: 'cache-only',
    variables: { slug },
  });

  const { data: articleListData } = useQuery(ArticleListDocument, {
    fetchPolicy: 'cache-only',
    variables: articleVariables(data?.author?.id),
    skip: !data?.author?.id,
  });

  if (!data?.author) {
    return null;
  }

  return (
    <WepAuthorPage
      author={data.author}
      articles={articleListData?.articles.nodes ?? []}
      page={page}
      onPageChange={value =>
        replace({ query: { ...query, page: value } }, undefined, {
          shallow: true,
          scroll: true,
        })
      }
    />
  );
}

export const getStaticPaths = async () => ({
  paths: [],
  fallback: 'blocking',
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug?.toString();
  const client = getApiClient(getApiUrl(), []);

  const [author] = await Promise.all([
    client.query<AuthorQuery>({
      query: AuthorDocument,
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

  const is404 =
    CombinedGraphQLErrors.is(author.error) &&
    author.error.errors.find(({ extensions }) => extensions?.status === 404);

  if (is404) {
    return {
      notFound: true,
      revalidate: 1,
    };
  }

  await client.query<ArticleListQuery>({
    query: ArticleListDocument,
    variables: articleVariables(author.data?.author?.id),
  });

  const props = addClientCacheToProps(client, {});

  return {
    props,
    revalidate: 60,
  };
};
