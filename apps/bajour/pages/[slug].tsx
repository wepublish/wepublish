import {PageContainer} from '@wepublish/page/website'
import {getPagePathsBasedOnPage} from '@wepublish/utils/website'
import {
  addClientCacheToV1Props,
  getV1ApiClient,
  NavigationListDocument,
  PageDocument,
  PeerProfileDocument
} from '@wepublish/website/api'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

import {Container} from '../src/components/layout/container'

export default function PageBySlug() {
  const {
    query: {slug}
  } = useRouter()

  return (
    <Container>
      <PageContainer slug={slug as string} />
    </Container>
  )
}

export const getStaticPaths = getPagePathsBasedOnPage('home')

export const getStaticProps: GetStaticProps = async ({params}) => {
  const {slug} = params || {}

  const {publicRuntimeConfig} = getConfig()
  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])
  await Promise.all([
    client.query({
      query: PageDocument,
      variables: {
        slug
      }
    }),
    client.query({
      query: NavigationListDocument
    }),
    client.query({
      query: PeerProfileDocument
    })
  ])

  const props = addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
