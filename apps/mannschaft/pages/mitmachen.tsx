import {SubscribePage, useUserCountry} from '@wepublish/utils/website'
import {Currency} from '@wepublish/website/api'
import {ComponentProps} from 'react'

type MitmachenProps = ComponentProps<typeof SubscribePage>

export default function Mitmachen(props: MitmachenProps) {
  const userCountry = useUserCountry() ?? 'CH'

  return (
    <SubscribePage
      {...props}
      filter={memberPlans =>
        memberPlans.filter(memberPlan => {
          if (userCountry === 'CH') {
            return memberPlan.currency === Currency.Chf
          }

          return memberPlan.currency === Currency.Eur
        })
      }
      fields={['firstName', 'address', 'birthday', 'password', 'passwordRepeated']}
    />
  )
}

Mitmachen.getInitialProps = SubscribePage.getInitialProps
