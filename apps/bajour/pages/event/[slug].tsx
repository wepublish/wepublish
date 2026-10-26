import { CombinedGraphQLErrors } from '@apollo/client';
import { EventContainer } from '@wepublish/event/website';
import { getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  EventDocument,
  getApiClient,
  NavigationListDocument,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';

import { Container } from '../../src/components/layout/container';

export default function EventBySlug() {
  const {
    query: { slug },
  } = useRouter();

  return (
    <Container>
      <EventContainer slug={slug as string} />
    </Container>
  );
}

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params!.slug!.toString();
  const client = getApiClient(getApiUrl(), []);

  const event = await Promise.all([
    client.query({
      query: EventDocument,
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
    CombinedGraphQLErrors.is(event[0].error) &&
    event[0].error.errors.find(({ extensions }) => extensions?.status === 404);

  if (is404) {
    return {
      notFound: true,
      revalidate: 1,
    };
  }

  const props = addClientCacheToProps(client, {});

  return {
    props,
    revalidate: 60,
  };
};
