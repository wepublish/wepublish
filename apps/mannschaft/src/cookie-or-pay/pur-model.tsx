import Head from 'next/head'
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
    window.cmp_pur_loggedin = hasSubscription
  }, [hasSubscription])

  return (
    <Head>
      <script>{`
          window.cmp_waitforimport = true;
          window.cmp_pur_enable = false; // disable for now
          window.cmp_pur_mode = 0;
      `}</script>
    </Head>
  )
}
