import {ApiV2} from '@wepublish/website'
import getConfig from 'next/config'
import React from 'react'

function TestStats() {
  // const client = ApiV2.useV2ApiClient(publicRuntimeConfig.env.API_URL!)

  const {loading, data} = ApiV2.useStatsQuery({
    // client,
    variables: {},
    onError: err => {
      console.log('error', err)
    },
    onCompleted: data => {
      console.log('data.stats', data.stats)
      // if (data.consent) {
      //   setConsent(mapApiDataToInput(data.consent))
      // }
    }
  })
  // console.log('data', data)

  return <div>siema</div>
}

const {publicRuntimeConfig} = getConfig()
const ConnectedApp = ApiV2.createWithV2ApiClient(publicRuntimeConfig.env.API_URL!)(TestStats)

export {ConnectedApp as default}
