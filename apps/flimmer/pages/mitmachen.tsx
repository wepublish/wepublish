import { PageContainer } from '@wepublish/page/website';
import {
  getSessionTokenProps,
  ssrAuthLink,
  tryServerSideJwtLogin,
  redirectToLoginWithError,
} from '@wepublish/utils/website';
import {
  addClientCacheToV1Props,
  getV1ApiClient,
  InvoicesDocument,
  MeDocument,
  MemberPlanListDocument,
  NavigationListDocument,
  PageDocument,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { NextPageContext } from 'next';
import getConfig from 'next/config';

export default function Mitmachen() {
  return <PageContainer slug={'mitmachen'} />;
}

Mitmachen.getInitialProps = async (ctx: NextPageContext) => {
  const { publicRuntimeConfig } = getConfig();
  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [
    ssrAuthLink(
      async () => (await getSessionTokenProps(ctx)).sessionToken?.token
    ),
  ]);

  if (ctx.query.jwt) {
    const success = await tryServerSideJwtLogin(ctx, client);

    if (!success) {
      redirectToLoginWithError(ctx);
      return {};
    }
  }

  const sessionProps = await getSessionTokenProps(ctx);

  const dataPromises = [
    client.query({
      query: PageDocument,
      variables: {
        slug: 'mitmachen',
      },
    }),
    client.query({
      query: MemberPlanListDocument,
      variables: {
        take: 50,
      },
    }),
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
  ];

  if (sessionProps.sessionToken) {
    dataPromises.push(
      ...[
        client.query({
          query: MeDocument,
        }),
        client.query({
          query: InvoicesDocument,
          variables: {
            take: 50,
          },
        }),
      ]
    );
  }

  await Promise.all(dataPromises);
  const props = addClientCacheToV1Props(client, sessionProps);

  return props;
};
