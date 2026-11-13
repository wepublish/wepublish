import { useQuery } from '@apollo/client/react';
import { WepEventOverview } from '@wepublish/tenant/wepublish-site';
import { getApiUrl } from '@wepublish/utils/website';
import {
  EventListDocument,
  EventSort,
  NavigationListDocument,
  PeerProfileDocument,
  SortOrder,
  addClientCacheToProps,
  getApiClient,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { z } from 'zod';

// All events at once: the overview splits them into coming and past ones
// itself and pages the past ones
const variables = {
  take: 500,
  skip: 0,
  sort: EventSort.StartsAt,
  order: SortOrder.Descending,
};

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional().default(1),
});

export default function EventList() {
  const { query, replace } = useRouter();
  const { page } = pageSchema.parse(query);

  const { data } = useQuery(EventListDocument, {
    fetchPolicy: 'cache-first',
    variables,
  });

  return (
    <WepEventOverview
      events={data?.events.nodes ?? []}
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
      query: EventListDocument,
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
