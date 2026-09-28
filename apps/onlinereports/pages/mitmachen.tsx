import styled from '@emotion/styled';
import { UserFormWrapper } from '@wepublish/authentication/website';
import { RichTextBlockWrapper } from '@wepublish/block-content/website';
import {
  SubscribeButton,
  SubscribeCancelable,
  SubscribeNarrowSection,
  SubscribeSection,
  SubscribeWrapper,
  TransactionFeeIcon,
} from '@wepublish/membership/website';
import { PageContainer } from '@wepublish/page/website';
import {
  getApiUrl,
  getSessionTokenProps,
  ssrAuthLink,
  SubscribePage,
} from '@wepublish/utils/website';
import { getApiClient, PageDocument } from '@wepublish/website/api';
import { NextPageContext } from 'next';
import { useEffect } from 'react';

import { useAdsContext } from '../src/context/ads-context';

const MitmachenPage = styled(PageContainer)`
  ${RichTextBlockWrapper} {
    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-column: -1/1;
    }
  }

  ${SubscribeWrapper} {
    grid-template-columns: 100%;
    grid-template-areas:
      'returning'
      'userForm'
      'memberPlans'
      'monthlyAmount'
      'paymentPeriodicity'
      'transactionFee'
      'challenge'
      'submit';

    gap: ${({ theme }) => theme.spacing(2.5)};
  }

  ${SubscribeSection},
  ${SubscribeNarrowSection} {
    grid-area: var(--grid-area);

    &:is(:nth-of-type(2)) {
      &:not(:has(+ :nth-of-type(3) > ${UserFormWrapper})) {
        grid-area: unset;
        grid-row: 1/3;
      }
    }
  }

  ${TransactionFeeIcon} {
    display: none;
  }

  ${SubscribeButton} {
    margin-bottom: ${({ theme }) => theme.spacing(4)};

    &:has(+ ${SubscribeCancelable}) {
      margin-bottom: 0;
    }
  }

  ${SubscribeCancelable} {
    font-weight: bold;
    margin-bottom: ${({ theme }) => theme.spacing(2)};
  }
`;

export default function Mitmachen() {
  const { setAdsDisabled } = useAdsContext();

  useEffect(() => {
    setAdsDisabled(true);
    return () => setAdsDisabled(false);
  }, [setAdsDisabled]);

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
