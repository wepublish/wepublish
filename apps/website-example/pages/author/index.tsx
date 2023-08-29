import {ApiV1, AuthorListContainer} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'

export default function AuthorList() {
  return (
    <AuthorListContainer
      variables={{
        sort: ApiV1.AuthorSort.Name,
        order: ApiV1.SortOrder.Ascending
      }}
    />
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
      query: ApiV1.AuthorListDocument,
      variables: {
        sort: ApiV1.AuthorSort.Name,
        order: ApiV1.SortOrder.Ascending
      }
    }),
    client.query({
      query: ApiV1.NavigationListDocument
    })
  ])

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
