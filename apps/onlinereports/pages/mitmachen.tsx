import { SubscribePage } from '@wepublish/utils/website';
import styled from '@emotion/styled';
import {
  SubscribeAmount,
  SubscribeWrapper,
  TransactionFeeIcon,
} from '@wepublish/membership/website';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useAdsContext } from '../src/context/ads-context';
import { ComponentProps, useEffect } from 'react';

const OnlineReportsSubscribePageWrapper = styled('div')`
  ${SubscribeWrapper} {
    font-weight: bold;
    grid-template-areas:
      'returning'
      'userForm'
      'memberPlans'
      'monthlyAmount'
      'paymentPeriodicity'
      'transactionFee'
      'challenge'
      'cta';
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
`;

type MitmachenInnerProps = ComponentProps<typeof SubscribePage>;

export const MitmachenInner = (props: MitmachenInnerProps) => (
  <SubscribePage
    {...props}
    fields={['firstName']}
  />
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
