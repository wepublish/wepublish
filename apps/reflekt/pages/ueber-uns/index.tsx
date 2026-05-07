//import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { AuthorListContainer } from '@wepublish/author/website';
import { PageContainer } from '@wepublish/page/website';
import { getApiUrl } from '@wepublish/utils/website';
import { AuthorSort, SortOrder } from '@wepublish/website/api';
import {
  addClientCacheToV1Props,
  AuthorListDocument,
  getV1ApiClient,
  NavigationListDocument,
  PageDocument,
  PeerProfileDocument,
  useAuthorListQuery,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { z } from 'zod';

import { MainSpacer } from '../../src/components/main-spacer';

const take = 25;

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional(),
});

const TeamPageContent = styled(PageContainer)``;

export default function AuthorList() {
  const {
    elements: { Pagination },
  } = useWebsiteBuilder();

  const { query, replace } = useRouter();
  const { page } = pageSchema.parse(query);

  const variables = useMemo(
    () => ({
      sort: AuthorSort.Name,
      order: SortOrder.Ascending,
      take,
      skip: ((page ?? 1) - 1) * take,
    }),
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

  return (
    <>
      <TeamPageContent slug="team">
        <MainSpacer maxWidth="lg">
          <AuthorListContainer variables={variables} />
        </MainSpacer>
      </TeamPageContent>

      {pageCount > 1 && (
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
      )}
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const { publicRuntimeConfig } = getConfig();

  if (!publicRuntimeConfig.env.API_URL) {
    return { props: {}, revalidate: 1 };
  }

  const client = getV1ApiClient(getApiUrl(), []);
  await Promise.all([
    client.query({
      query: AuthorListDocument,
      variables: {
        take,
        skip: 0,
        sort: AuthorSort.Name,
        order: SortOrder.Ascending,
      },
    }),
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
    client.query({
      query: PageDocument,
      variables: {
        slug: 'team',
      },
    }),
  ]);

  const props = addClientCacheToV1Props(client, {});

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
