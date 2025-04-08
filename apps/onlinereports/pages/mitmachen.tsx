import {SubscribePage} from '@wepublish/utils/website'
import styled from '@emotion/styled'
import {SubscribeAmount, SubscribeWrapper, TransactionFeeIcon} from '@wepublish/membership/website'
import {useWebsiteBuilder} from '@wepublish/website/builder'

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
`

const SubscribePageWrapper = styled('div')`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.spacing(2.5)};
  margin-top: ${({theme}) => theme.spacing(4)};

  ${TransactionFeeIcon} {
    display: none;
  }

  ${SubscribeAmount} {
    background: ${({theme}) => theme.palette.secondary.main};
  }
`

export const MitmachenInner = () => <SubscribePage fields={['firstName']} />

export default function Mitmachen() {
  const {
    elements: {H3}
  } = useWebsiteBuilder()

  return (
    <SubscribePageWrapper>
      <H3 component="h1">Herzlichen Dank für Ihre Unterstützung!</H3>
      <OnlineReportsSubscribePageWrapper>
        <MitmachenInner />
      </OnlineReportsSubscribePageWrapper>
    </SubscribePageWrapper>
  )
}

Mitmachen.getInitialProps = SubscribePage.getInitialProps
