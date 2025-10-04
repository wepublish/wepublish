import { AuthTokenStorageKey } from '@wepublish/authentication/website';
import { PageContainer } from '@wepublish/page/website';
import { getSessionTokenProps, ssrAuthLink } from '@wepublish/utils/website';
import {
  addClientCacheToV1Props,
  getV1ApiClient,
  InvoicesDocument,
  LoginWithJwtDocument,
  MeDocument,
  MemberPlanListDocument,
  NavigationListDocument,
  PageDocument,
  PeerProfileDocument,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import { setCookie } from 'cookies-next';
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
    const data = await client.mutate({
      mutation: LoginWithJwtDocument,
      variables: {
        jwt: ctx.query.jwt,
      },
    });

    setCookie(
      AuthTokenStorageKey,
      JSON.stringify(
        data.data.createSessionWithJWT as SessionWithTokenWithoutUser
      ),
      {
        req: ctx.req,
        res: ctx.res,
        expires: new Date(data.data.createSessionWithJWT.expiresAt),
        sameSite: 'strict',
      }
    );
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
