import { CombinedGraphQLErrors } from '@apollo/client';
import styled from '@emotion/styled';
import { PageContainer } from '@wepublish/page/website';
import { getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  getApiClient,
  NavigationListDocument,
  PageDocument,
  PageQuery,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { ComponentProps } from 'react';

import { BkaSidebar } from '../src/components/cta/bka-sidebar';

const PageGrid = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  align-items: start;
  gap: ${({ theme }) => theme.spacing(5)};

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-template-columns: minmax(0, 1fr) 364px;
    column-gap: 126px;
  }
`;

export default function PageBySlugOrId() {
  const {
    query: { slug, id },
  } = useRouter();

  const containerProps = {
    slug,
    id,
  } as ComponentProps<typeof PageContainer>;

  return (
    <PageGrid>
      <PageContainer {...containerProps} />

      <BkaSidebar />
    </PageGrid>
  );
}

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug?.toString();
  const id = params?.id?.toString();
  const client = getApiClient(getApiUrl(), []);
  const [page] = await Promise.all([
    client.query<PageQuery>({
      query: PageDocument,
      variables: {
        slug,
        id,
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
    CombinedGraphQLErrors.is(page.error) &&
    page.error.errors.find(({ extensions }) => extensions?.status === 404);

  if (is404) {
    return {
      notFound: true,
      revalidate: 1,
    };
  }

  const props = addClientCacheToProps(client, {});

  return {
    props,
    revalidate: !page.data?.page ? 1 : 60, // every 60 seconds
  };
};
