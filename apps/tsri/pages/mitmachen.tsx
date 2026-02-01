import styled from '@emotion/styled';
import {
  AuthTokenStorageKey,
  UserFormWrapper,
} from '@wepublish/authentication/website';
import { SubscribeWrapper } from '@wepublish/membership/website';
import { PageContainer } from '@wepublish/page/website';
import { getSessionTokenProps, ssrAuthLink } from '@wepublish/utils/website';
import { SubscribePage } from '@wepublish/utils/website';
import { SessionWithTokenWithoutUser } from '@wepublish/website/api';
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
} from '@wepublish/website/api';
import { setCookie } from 'cookies-next';
import { NextPageContext } from 'next';
import getConfig from 'next/config';

const MitmachenPage = styled(PageContainer)`
  ${SubscribeWrapper} {
    padding-top: ${({ theme }) => theme.spacing(1.5)};
    grid-row: 2;

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-column: 2/12;
    }
  }

  ${UserFormWrapper} {
    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }
`;

export const MitmachenInner = () => (
  <SubscribePage
    fields={['firstName']}
    filter={plans =>
      plans.filter(plan => plan.tags?.some(tag => tag === 'selling'))
    }
  />
);

export default function Mitmachen() {
  return (
    <MitmachenPage slug={'mitmachen'}>
      <MitmachenInner />
    </MitmachenPage>
  );
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
