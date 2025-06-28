import {ComponentType, memo} from 'react'
import {storeBypassToken} from './paywall-bypass'

export const withPaywallBypassToken = <
  // eslint-disable-next-line @typescript-eslint/ban-types
  P extends object
>(
  ControlledComponent: ComponentType<P>
) =>
  memo<P>(props => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      const paywallToken = url.searchParams.get('paywallToken')

      if (paywallToken) {
        url.searchParams.delete('paywallToken')
        window.history.replaceState(null, '', url.toString())
        storeBypassToken(paywallToken)
      }
    }

    return <ControlledComponent {...(props as P)} />
  })
