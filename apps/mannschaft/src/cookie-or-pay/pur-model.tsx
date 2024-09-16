import {useEffect} from 'react'

import {useHasSubscription} from '../paywall/has-subscription'

declare global {
  // https://help.consentmanager.net/books/cmp/page/implementing-a-pay-or-accept-%28pur%29-model
  interface Window {
    cmp_pur_enable: boolean
    cmp_pur_mode: 0 | 1 | 2
    cmp_pur_loggedin: boolean
  }
}

export const PURModel = () => {
  const hasSubscription = useHasSubscription()

  useEffect(() => {
    window.cmp_pur_enable = true
    window.cmp_pur_mode = 0

    if (hasSubscription) {
      window.cmp_pur_loggedin = true
    }
  }, [hasSubscription])

  return null
}