import {
  IntendedRouteStorageKey,
  RegistrationFormContainer,
  useUser,
} from '@wepublish/authentication/website';
import { PageContainer } from '@wepublish/page/website';
import {
  addClientCacheToV1Props,
  getV1ApiClient,
  NavigationListDocument,
  PageDocument,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { deleteCookie, getCookie } from 'cookies-next';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';

import { HauptstadtContentFullWidth } from '../src/components/hauptstadt-content-wrapper';
import { HAS_FORM_FIELDS } from './mitmachen';

export default function SignUp() {
  const { hasUser } = useUser();
  const router = useRouter();

  if (hasUser && typeof window !== 'undefined') {
    const intendedRoute = getCookie(IntendedRouteStorageKey)?.toString();
    deleteCookie(IntendedRouteStorageKey);
    const route = intendedRoute ?? '/profile';

    router.replace(route);
  }

  return (
    <PageContainer slug="signup">
      <HauptstadtContentFullWidth>
        <RegistrationFormContainer fields={HAS_FORM_FIELDS} />
      </HauptstadtContentFullWidth>
    </PageContainer>
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
      query: PageDocument,
      variables: {
        slug: 'login',
      },
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
