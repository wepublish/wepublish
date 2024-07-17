import {ApiV1} from '@wepublish/website'
import {GetServerSideProps} from 'next'
import getConfig from 'next/config'

import PageBySlugIdOrToken from '../[slug]'

export default function PreviewPageByToken() {
  return <PageBySlugIdOrToken />
}

export const getServerSideProps = (async ({params}) => {
  const {token} = params || {}
  const {publicRuntimeConfig} = getConfig()

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

  const [page] = await Promise.all([
    client.query({
      query: ApiV1.PageDocument,
      variables: {
        token
      }
    }),
    client.query({
      query: ApiV1.NavigationListDocument
    }),
    client.query({
      query: ApiV1.PeerProfileDocument
    })
  ])

  if (page.data && !page.data.page) {
    return {
      notFound: true
    }
  }

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {props}
}) satisfies GetServerSideProps
