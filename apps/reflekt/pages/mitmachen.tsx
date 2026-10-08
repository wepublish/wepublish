import { PageContainer } from '@wepublish/page/website';
import {
  getApiUrl,
  getSessionTokenProps,
  ssrAuthLink,
  SubscribePage,
} from '@wepublish/utils/website';
import {
  getApiClient,
  PageDocument,
  V1_CLIENT_STATE_PROP_NAME,
} from '@wepublish/website/api';
import { NormalizedCacheObject } from '@apollo/client';
import { NextPageContext } from 'next';
import { ComponentProps } from 'react';

export default function Mitmachen(props: ComponentProps<typeof SubscribePage>) {
  return <PageContainer slug="mitmachen" />;
}

Mitmachen.getInitialProps = async (ctx: NextPageContext) => {
  if (typeof window !== 'undefined') {
    return {};
  }

  const client = getApiClient(getApiUrl(), [
    ssrAuthLink(
      async () => (await getSessionTokenProps(ctx)).sessionToken?.token
    ),
  ]);

  await Promise.all([
    client.query({
      query: PageDocument,
      variables: {
        slug: 'mitmachen',
      },
    }),
    client.query({
      query: PageDocument,
      variables: {
        slug: 'footer',
      },
    }),
  ]);

  const subscribeProps = (await SubscribePage.getInitialProps(ctx)) as {
    [V1_CLIENT_STATE_PROP_NAME]?: NormalizedCacheObject;
  };
  const subscribeState = subscribeProps[V1_CLIENT_STATE_PROP_NAME] ?? {};
  const pageState = client.cache.extract() as NormalizedCacheObject;

  return {
    ...subscribeProps,
    [V1_CLIENT_STATE_PROP_NAME]: {
      ...subscribeState,
      ...pageState,
      ROOT_QUERY: { ...subscribeState.ROOT_QUERY, ...pageState.ROOT_QUERY },
    },
  };
};
