import styled from '@emotion/styled';
import { UserFormWrapper } from '@wepublish/authentication/website';
import { SubscribeWrapper } from '@wepublish/membership/website';
import { PageContainer } from '@wepublish/page/website';
import { SubscribePage } from '@wepublish/utils/website/next';
import { NextPageContext } from 'next';

const MitmachenPage = styled(PageContainer)`
  ${SubscribeWrapper} {
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

Mitmachen.getInitialProps = (ctx: NextPageContext) =>
  SubscribePage.getInitialProps(ctx, { pageSlug: 'mitmachen' });
