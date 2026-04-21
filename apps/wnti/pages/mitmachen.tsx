import styled from '@emotion/styled';
import { UserFormWrapper } from '@wepublish/authentication/website';
import { SubscribeWrapper } from '@wepublish/membership/website';
import { PageContainer } from '@wepublish/page/website';
import {
  getSessionTokenProps,
  handleJwtLogin,
  ssrAuthLink,
} from '@wepublish/utils/website';
import { SubscribePage } from '@wepublish/utils/website';
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

const MitmachenPage = styled(PageContainer)`
  ${SubscribeWrapper} {
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
    defaults={{ memberPlanSlug: 'mitgliedschaft' }}
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
  const props = addClientCacheToV1Props(client, sessionProps);

  return props;
};
