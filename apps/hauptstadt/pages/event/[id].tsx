import { EventContainer } from '@wepublish/event/website';
import { getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  EventDocument,
  getApiClient,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';

export default function EventById() {
  const {
    query: { id },
  } = useRouter();

  return <EventContainer id={id as string} />;
}

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { id } = params || {};
  const client = getApiClient(getApiUrl(), []);
  const event = await client.query({
    query: EventDocument,
    variables: {
      id,
    },
  });
  const is404 = event.errors?.find(
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
