import {styled} from '@mui/material'
import {ApiV1, PageContainer} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'

import {
  MailChimpCampaign,
  MailChimpCampaignResponse,
  MailchimpConfig,
  MailChimpProvider
} from '../context/MailChimpContext'
import mailchimp from '../services/mailchimp'

async function fetchMailChimpCampaigns(
  apiKey: string,
  server: string
): Promise<MailChimpCampaign[]> {
  if (!apiKey) {
    console.warn('No Mailchimp API key provided!')
    return []
  }
  
  if (!server) {
    console.warn('No Mailchimp server prefix provided!')
    return []
  }
  
  try {
    mailchimp.setConfig({
      apiKey,
      server
    } as MailchimpConfig)
    const {campaigns} = (await mailchimp.campaigns.list({
      count: 4,
      sort_field: 'send_time',
      status: 'sent',
      sort_dir: 'DESC',
      folder_id: '90c02813e1',
      fields: ['campaigns.id', 'campaigns.long_archive_url', 'campaigns.settings.subject_line']
    })) as MailChimpCampaignResponse

    return campaigns
  } catch (e) {
    console.warn(e)
    return []
  }
}

const Homepage = styled(PageContainer)`
  grid-column: -1/1;
  gap: ${({theme}) => theme.spacing(3)};

  ${({theme}) => theme.breakpoints.up('sm')} {
    gap: ${({theme}) => theme.spacing(6)};
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    gap: ${({theme}) => theme.spacing(5)};
    grid-column: 2/3;
  }

  ${({theme}) => theme.breakpoints.up('xl')} {
    gap: ${({theme}) => theme.spacing(10)};
  }
`

const Index: React.FC<{mcCampaigns: MailChimpCampaign[]}> = ({mcCampaigns}) => {
  return (
    <MailChimpProvider campaigns={mcCampaigns}>
      <Homepage slug={'home'} />
    </MailChimpProvider>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const {publicRuntimeConfig} = getConfig()

  if (!publicRuntimeConfig.env.API_URL) {
    return {props: {}, revalidate: 1}
  }

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL, [])
  await Promise.all([
    client.query({
      query: ApiV1.PageDocument,
      variables: {
        slug: 'home'
      }
    })
  ])

  const apiKey = process.env.MAILCHIMP_API_KEY || ''
  const server = process.env.MAILCHIMP_SERVER_PREFIX || ''
  const mcCampaigns = await fetchMailChimpCampaigns(apiKey, server)

  const props = ApiV1.addClientCacheToV1Props(client, {mcCampaigns})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}

export default Index
