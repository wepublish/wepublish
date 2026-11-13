import { useQuery } from '@apollo/client/react';
import { WepTeamPage } from '@wepublish/tenant/wepublish-site';
import { getApiUrl } from '@wepublish/utils/website';
import {
  AuthorListDocument,
  AuthorSort,
  NavigationListDocument,
  PeerProfileDocument,
  SortOrder,
  addClientCacheToProps,
  getApiClient,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';

// The whole team on one page
const variables = {
  sort: AuthorSort.Name,
  order: SortOrder.Ascending,
  take: 100,
  skip: 0,
  filter: {
    hideOnTeam: false,
  },
};

export default function AuthorList() {
  const { data } = useQuery(AuthorListDocument, {
    fetchPolicy: 'cache-first',
    variables,
  });

  return <WepTeamPage authors={data?.authors.nodes ?? []} />;
}

export const getStaticProps = (async () => {
  if (!getApiUrl()) {
    return { props: {}, revalidate: 1 };
  }

  const client = getApiClient(getApiUrl(), []);
  await Promise.all([
    client.query({
      query: AuthorListDocument,
      variables,
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
