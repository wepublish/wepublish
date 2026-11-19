import { useQuery } from '@apollo/client/react';
import { WepArticleOverview } from '@wepublish/tenant/wepublish-site';
import { getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  ArticleListDocument,
  getApiClient,
  NavigationListDocument,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { z } from 'zod';

// All articles at once: the language is only in the slug, so the overview
// filters and pages them itself (We.Publish has a few hundred at most)
const take = 500;

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional().default(1),
});

export default function ArticleOverview() {
  const { query, replace } = useRouter();
  const { page } = pageSchema.parse(query);

  const { data } = useQuery(ArticleListDocument, {
    fetchPolicy: 'cache-first',
    variables: { take, skip: 0 },
  });

  return (
    <WepArticleOverview
      articles={data?.articles.nodes ?? []}
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

export const getStaticProps = (async () => {
  if (!getApiUrl()) {
    return { props: {}, revalidate: 1 };
  }

  const client = getApiClient(getApiUrl(), []);

  await Promise.all([
    client.query({
      query: ArticleListDocument,
      variables: { take, skip: 0 },
    }),
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
  ]);

  return {
    props: addClientCacheToProps(client, {}),
    revalidate: 60,
  };
}) satisfies GetStaticProps;
