import {getPagePathsBasedOnPage} from '@wepublish/utils/website'
import {ApiV1, PageContainer} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {ComponentProps} from 'react'

export default function PageBySlugIdOrToken() {
  const {
    query: {slug, id, token}
  } = useRouter()

  const containerProps = {
    slug,
    id,
    token
  } as ComponentProps<typeof PageContainer>

  return <PageContainer {...containerProps} />
}

export const getStaticPaths = () => getPagePathsBasedOnPage('', 20, ['newsletter'])

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
