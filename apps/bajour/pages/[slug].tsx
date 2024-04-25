import {getPagePathsBasedOnPage} from '@wepublish/utils/website'
import {ApiV1, PageContainer} from '@wepublish/website'
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
  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])
  await Promise.all([
    client.query({
      query: ApiV1.PageDocument,
      variables: {
        slug
      }
    }),
    client.query({
      query: ApiV1.NavigationListDocument
    }),
    client.query({
      query: ApiV1.PeerProfileDocument
    })
  ])

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
