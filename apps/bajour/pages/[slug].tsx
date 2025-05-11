import {PageContainer} from '@wepublish/page/website'
import {getPagePathsBasedOnPage} from '@wepublish/utils/website'
import {
  addClientCacheToV1Props,
  getV1ApiClient,
  NavigationListDocument,
  PageDocument,
  PageQuery,
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
  const [page] = await Promise.all([
    client.query<PageQuery>({
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
    revalidate: !page.data?.page ? 1 : 60 // every 60 seconds
  }
}
