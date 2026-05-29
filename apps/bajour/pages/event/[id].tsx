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

export default function EventById() {
  const {
    query: { id },
  } = useRouter();

  return (
    <Container>
      <EventContainer id={id as string} />
    </Container>
  );
}

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { id } = params || {};
  const client = getApiClient(getApiUrl(), []);

  const event = await Promise.all([
    client.query({
      query: EventDocument,
      variables: {
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

  const is404 = event[0].errors?.find(
    ({ extensions }) => extensions?.status === 404
  );

  if (is404) {
    return {
      notFound: true,
      revalidate: 1,
    };
  }

  const props = addClientCacheToProps(client, {});

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
