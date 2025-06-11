import {useEffect} from 'react'
import {useRouter} from 'next/router'
import {PaywallBypassService} from './paywall-bypass'

export const usePaywallBypassToken = () => {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return

    if (router.query.paywallToken) {
      const {paywallToken, ...restQuery} = router.query
      router.replace(
        {
          pathname: router.pathname,
          query: restQuery
        },
        undefined,
        {shallow: true}
      )

      PaywallBypassService.storeBypassToken(paywallToken as string)
    }
  }, [router.isReady, router.query, router])
}
