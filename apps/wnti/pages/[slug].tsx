import {ContentWidthProvider} from '@wepublish/content/website'
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
import {ComponentProps} from 'react'

export default function PageBySlugOrId() {
  const {
    query: {slug, id, token}
  } = useRouter()

  const containerProps = {
    slug,
    id,
    token
  } as ComponentProps<typeof PageContainer>

  return (
    <ContentWidthProvider fullWidth={true}>
      <PageContainer {...containerProps} />
    </ContentWidthProvider>
  )
}

export const getStaticPaths = getPagePathsBasedOnPage('')

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
