import mailchimp, {campaigns} from '@mailchimp/mailchimp_marketing'
import {ApiV1, ContentWidthProvider, PageContainer} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'

import {DailyBriefingContext} from '../src/components/daily-briefing/daily-briefing-teaser'

type IndexProps = {
  campaigns: campaigns.Campaigns[]
}

export default function Index({campaigns}: IndexProps) {
  return (
    <DailyBriefingContext.Provider value={campaigns}>
      <ContentWidthProvider fullWidth={true}>
        <PageContainer slug={''} />
      </ContentWidthProvider>
    </DailyBriefingContext.Provider>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const {publicRuntimeConfig, serverRuntimeConfig} = getConfig()

  if (!publicRuntimeConfig.env.API_URL) {
    return {props: {}, revalidate: 1}
  }

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL, [])

  const props = ApiV1.addClientCacheToV1Props(client, {campaigns})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
