import { CombinedGraphQLErrors } from '@apollo/client';
import { EventContainer } from '@wepublish/event/website';
import { getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  EventDocument,
  getApiClient,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';

export default function EventBySlug() {
  const {
    query: { slug },
  } = useRouter();

  return <EventContainer slug={slug as string} />;
}

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params!.slug!.toString();
  const client = getApiClient(getApiUrl(), []);
  const event = await client.query({
    query: EventDocument,
    variables: {
      slug,
    },
  });
  const is404 =
    CombinedGraphQLErrors.is(event.error) &&
    event.error.errors.find(({ extensions }) => extensions?.status === 404);

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
