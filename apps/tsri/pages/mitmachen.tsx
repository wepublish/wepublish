import styled from '@emotion/styled';
import { UserFormWrapper } from '@wepublish/authentication/website';
import { SubscribeWrapper } from '@wepublish/membership/website';
import { PageContainer } from '@wepublish/page/website';
import {
  getApiUrl,
  getSessionTokenProps,
  ssrAuthLink,
} from '@wepublish/utils/website';
import { SubscribePage } from '@wepublish/utils/website';
import { getApiClient, PageDocument } from '@wepublish/website/api';
import { NextPageContext } from 'next';

const MitmachenPage = styled(PageContainer)`
  ${SubscribeWrapper} {
    padding-top: ${({ theme }) => theme.spacing(1.5)};

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

export default function Mitmachen() {
  return <MitmachenPage slug={'mitmachen'} />;
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
  ]);

  return SubscribePage.getInitialProps(ctx);
};
