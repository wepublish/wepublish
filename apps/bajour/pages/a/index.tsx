import {ApiV1, ArticleListContainer} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'

import {Container} from '../../src/components/layout/container'

export default function ArticleList() {
  return (
    <Container>
      <ArticleListContainer />
    </Container>
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
      query: ApiV1.ArticleListDocument
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
