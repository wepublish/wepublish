import styled from '@emotion/styled';
import {
  SubscribeAmount,
  SubscribeWrapper,
  TransactionFeeIcon,
} from '@wepublish/membership/website';
import { SubscribePage } from '@wepublish/utils/website';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useEffect } from 'react';

import { useAdsContext } from '../src/context/ads-context';

const OnlineReportsSubscribePageWrapper = styled('div')`
  ${SubscribeWrapper} {
    grid-template-columns: 100%;
    grid-template-areas:
      'returning'
      'userForm'
      'memberPlans'
      'monthlyAmount'
      'paymentPeriodicity'
      'challenge'
      'transactionFee'
      'challenge'
      'submit';
    ${({ theme }) => theme.breakpoints.down('md')} {
      gap: ${({ theme }) => theme.spacing(2.5)};
    }
  }

  ${SubscribeSection},
  ${SubscribeNarrowSection} {
    grid-area: var(--grid-area);
  }
`;

const SubscribePageWrapper = styled('div')`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2.5)};
  margin-top: ${({ theme }) => theme.spacing(4)};

  ${TransactionFeeIcon} {
    display: none;
  }

  ${SubscribeAmount} {
    background: ${({ theme }) => theme.palette.secondary.main};
  }

  ${SubscribeCancelable} {
    font-weight: bold;
  }
`;

export const MitmachenInner = () => (
  <OnlineReportsSubscribePageWrapper>
    <SubscribePage fields={['firstName']} />
  </OnlineReportsSubscribePageWrapper>
);

export default function Mitmachen() {
  const { setAdsDisabled } = useAdsContext();

  const {
    elements: { H3 },
  } = useWebsiteBuilder();

  useEffect(() => {
    setAdsDisabled(true);
    return () => setAdsDisabled(false);
  }, [setAdsDisabled]);

  return (
    <SubscribePageWrapper>
      <H3 component="h1">Herzlichen Dank für Ihre Unterstützung!</H3>
      <MitmachenInner />
    </SubscribePageWrapper>
  );
}

Mitmachen.getInitialProps = SubscribePage.getInitialProps;
