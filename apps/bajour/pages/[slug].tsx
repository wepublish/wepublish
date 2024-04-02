import {ApiV1, PageContainer} from '@wepublish/website'
import {GetStaticPaths, GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

export default function PageBySlug() {
  const {
    query: {slug}
  } = useRouter()

  return <PageContainer slug={slug as string} />
}

export const getStaticPaths: GetStaticPaths = async () => {
  const {publicRuntimeConfig} = getConfig()
  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

  await client.query({
    query: ApiV1.PageDocument,
    variables: {
      slug: 'home'
    }
  })

  const cache = Object.values(client.cache.extract())
  const pageSlugs = cache.reduce((slugs, storeObj) => {
    if (storeObj?.__typename === 'Page') {
      slugs.push((storeObj as ApiV1.Page).slug)
    }

    return slugs
  }, [] as string[])

  return {
    paths: pageSlugs.map(slug => ({
      params: {
        slug
      }
    })),
    fallback: true
  }
}

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
