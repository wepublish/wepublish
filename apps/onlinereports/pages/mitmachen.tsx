import {SubscribePage} from '@wepublish/utils/website'
import styled from '@emotion/styled'
import {SubscribeWrapper} from '@wepublish/membership/website'

const OnlineReportsSubscribePageWrapper = styled('div')`
  ${SubscribeWrapper} {
    font-weight: bold;
    grid-template-areas:
      'returning'
      'userForm'
      'memberPlans'
      'monthlyAmount'
      'paymentPeriodicity'
      'challenge'
      'transactionFee'
      'cta';
  }
`

export const MitmachenInner = () => <SubscribePage fields={['firstName']} />

export default function Mitmachen() {
  return (
    <OnlineReportsSubscribePageWrapper>
      <MitmachenInner />
    </OnlineReportsSubscribePageWrapper>
  )
}

Mitmachen.getInitialProps = SubscribePage.getInitialProps
