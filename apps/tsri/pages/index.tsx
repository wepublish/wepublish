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
      <ContentWidthProvider fullWidth={false}>
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

  mailchimp.setConfig({
    apiKey: serverRuntimeConfig.env.MAILCHIMP_API_KEY,
    server: serverRuntimeConfig.env.MAILCHIMP_SERVER_PREFIX
  })

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL, [])
  const [mailchimpResponse] = await Promise.all([
    mailchimp.campaigns.list({
      count: 4,
      sortField: 'send_time',
      status: 'sent',
      sortDir: 'DESC',
      folderId: '90c02813e1',
      fields: ['campaigns.id', 'campaigns.long_archive_url', 'campaigns.settings.subject_line']
    }),
    client.query({
      query: ApiV1.PageDocument,
      variables: {
        slug: ''
      }
    }),
    client.query({
      query: ApiV1.NavigationListDocument
    }),
    client.query({
      query: ApiV1.PeerProfileDocument
    })
  ])

  const {campaigns} = mailchimpResponse as campaigns.CampaignsSuccessResponse

  const props = ApiV1.addClientCacheToV1Props(client, {campaigns})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
