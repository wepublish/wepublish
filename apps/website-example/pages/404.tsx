import {PageContainer} from '@wepublish/page/website'
import {
  addClientCacheToV1Props,
  getV1ApiClient,
  NavigationListDocument,
  PageDocument,
  PageQuery
} from '@wepublish/website/api'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {ComponentProps} from 'react'

export default function Custom404() {
  //return <h1>404 - Page Not Found</h1>

  const containerProps = {
    slug: 'my-404-page'
  } as ComponentProps<typeof PageContainer>

  return <PageContainer {...containerProps} />
}

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
    })
  ])

  //console.log('page', page.data);

  const props = addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: !page.data?.page ? 1 : 60 // every 60 seconds
  }
}
