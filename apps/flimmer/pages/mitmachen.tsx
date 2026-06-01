import { PageContainer } from '@wepublish/page/website';
import {
  getApiUrl,
  getSessionTokenProps,
  handleJwtLogin,
  ssrAuthLink,
} from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  getApiClient,
  InvoicesDocument,
  MeDocument,
  MemberPlanListDocument,
  NavigationListDocument,
  PageDocument,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { NextPageContext } from 'next';
export default function Mitmachen() {
  return <PageContainer slug={'mitmachen'} />;
}

Mitmachen.getInitialProps = async (ctx: NextPageContext) => {
  const client = getApiClient(getApiUrl(), [
    ssrAuthLink(
      async () => (await getSessionTokenProps(ctx)).sessionToken?.token
    ),
  ]);

  await handleJwtLogin(ctx, client, undefined);

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
  const props = addClientCacheToProps(client, sessionProps);

  return props;
};
