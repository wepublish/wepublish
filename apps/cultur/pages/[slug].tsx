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
import {ComponentProps} from 'react'

export default function PageBySlugOrId() {
  const {
    query: {slug, id}
  } = useRouter()

  const containerProps = {
    slug,
    id
  } as ComponentProps<typeof PageContainer>

  return <PageContainer {...containerProps} />
}

export const getStaticPaths = getPagePathsBasedOnPage('', 20, ['newsletter'])

export const getStaticProps: GetStaticProps = async ({params}) => {
  const {slug, id} = params || {}
  const {publicRuntimeConfig} = getConfig()

  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])
  const [page] = await Promise.all([
    client.query<PageQuery>({
      query: PageDocument,
      variables: {
        slug,
        id
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
