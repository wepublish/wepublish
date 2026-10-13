import styled from '@emotion/styled';
import { UserFormWrapper } from '@wepublish/authentication/website';
import {
  ImageGalleryBlockWrapper,
  TeaserGridBlockWrapper,
} from '@wepublish/block-content/website';
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
  /* Shield against TsriPage's two-column page layout: restore the shared
     default centered layout for this route. Relies on TsriPage staying free
     of !important. */
  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(12, 1fr) !important;
    justify-content: initial !important;

    & > * {
      grid-column: 4/10 !important;
    }

    & > :is(${TeaserGridBlockWrapper}, ${ImageGalleryBlockWrapper}) {
      grid-column: -1/1 !important;
    }
  }

  ${SubscribeWrapper} {
    padding-top: ${({ theme }) => theme.spacing(1.5)};

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-column: 2/12 !important;
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
