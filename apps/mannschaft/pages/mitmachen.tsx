import {SubscribePage, useUserCountry} from '@wepublish/utils/website'
import {ApiV1} from '@wepublish/website'

export default function Mitmachen() {
  const userCountry = useUserCountry() ?? 'CH'

  return (
    <SubscribePage
      filter={memberPlans =>
        memberPlans.filter(memberPlan => {
          if (userCountry === 'CH') {
            return memberPlan.currency === ApiV1.Currency.Chf
          }

          return memberPlan.currency === ApiV1.Currency.Eur
        })
      }
      fields={['firstName', 'address', 'birthday', 'password', 'passwordRepeated']}
    />
  )
}

Mitmachen.getInitialProps = SubscribePage.getInitialProps
