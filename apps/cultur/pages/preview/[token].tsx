import {GetServerSideProps} from 'next'
import getConfig from 'next/config'

import PageBySlugOrId from '../[slug]'

export default function PreviewPageByToken() {
  return <PageBySlugOrId />
}

export const getServerSideProps = (async ({params}) => {
  const {token} = params || {}
  const {publicRuntimeConfig} = getConfig()

  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

  const [page] = await Promise.all([
    client.query({
      query: PageDocument,
      variables: {
        token
      }
    }),
    client.query({
      query: NavigationListDocument
    }),
    client.query({
      query: PeerProfileDocument
    })
  ])

  if (page.data && !page.data.page) {
    return {
      notFound: true
    }
  }

  const props = addClientCacheToV1Props(client, {})

  return {props}
}) satisfies GetServerSideProps
