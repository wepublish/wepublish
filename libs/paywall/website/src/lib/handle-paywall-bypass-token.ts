import {storeBypassToken} from './paywall-bypass'

export const handlePaywallBypassToken = () => {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  const paywallToken = url.searchParams.get('paywallToken')

  if (paywallToken) {
    url.searchParams.delete('paywallToken')
    window.history.replaceState(null, '', url.toString())
    storeBypassToken(paywallToken)
  }
}
