import { AuthorListContainer } from '@wepublish/author/website';
import { AuthorSort, SortOrder } from '@wepublish/website/api';
import {
  addClientCacheToV1Props,
  AuthorListDocument,
  AuthorListQueryVariables,
  getV1ApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  useAuthorListQuery,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { z } from 'zod';

const take = 25;

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional(),
});

export default function AuthorList() {
  const {
    elements: { Pagination },
  } = useWebsiteBuilder();

  const { query, replace } = useRouter();
  const { page } = pageSchema.parse(query);

  const variables = useMemo(
    () =>
      ({
        sort: AuthorSort.Name,
        order: SortOrder.Ascending,
        take,
        skip: ((page ?? 1) - 1) * take,
        filter: {
          hideOnTeam: false,
        },
      }) satisfies AuthorListQueryVariables,
    [page]
  );

  const { data } = useAuthorListQuery({
    fetchPolicy: 'cache-only',
    variables,
  });

  const pageCount = useMemo(() => {
    if (data?.authors.totalCount && data?.authors.totalCount > take) {
      return Math.ceil(data.authors.totalCount / take);
    }

    return 1;
  }, [data?.authors.totalCount]);

  const canonicalUrl = '/author'

  return (
    <>
      <AuthorListContainer variables={variables} />

      {pageCount > 1 && (
        <>
          <Head>
            <link rel="canonical" key="canonical" href={canonicalUrl} />
          </Head>

        <Pagination
          page={page ?? 1}
          count={pageCount}
          onChange={(_, value) =>
            replace(
              {
                query: { ...query, page: value },
              },
              undefined,
              { shallow: true, scroll: true }
            )
          }
        />
        </>
      )}
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const { publicRuntimeConfig } = getConfig();

  if (!publicRuntimeConfig.env.API_URL) {
    return { props: {}, revalidate: 1 };
  }

  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL, []);

  await Promise.all([
    client.query({
      query: AuthorListDocument,
      variables: {
        take,
        skip: 0,
        sort: AuthorSort.Name,
        order: SortOrder.Ascending,
        filter: {
          hideOnTeam: false,
        },
      } satisfies AuthorListQueryVariables,
    }),
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
  ]);

  const props = addClientCacheToV1Props(client, {});

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
