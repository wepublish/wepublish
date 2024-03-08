import {capitalize} from '@mui/material'
import {ApiV1, ArticleListContainer, useWebsiteBuilder} from '@wepublish/website'
import {GetStaticPaths, GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

export default function ArticleListByTag() {
  const {
    elements: {H3, Alert}
  } = useWebsiteBuilder()

  const {
    query: {tag}
  } = useRouter()

  const {data, loading} = ApiV1.useArticleListQuery({
    fetchPolicy: 'cache-only',
    variables: {
      filter: {
        tags: [tag as string]
      }
    }
  })

  return (
    <>
      <H3 component="h1">{capitalize(tag as string)}</H3>

      {!loading && !data?.articles.nodes.length && (
        <Alert severity="info">Keine Artikel vorhanden</Alert>
      )}

      <ArticleListContainer
        variables={{
          filter: {
            tags: [tag as string]
          }
        }}
      />
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking'
  }
}

export const getStaticProps: GetStaticProps = async ({params}) => {
  const {tag} = params || {}
  const {publicRuntimeConfig} = getConfig()

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])
  await Promise.all([
    client.query({
      query: ApiV1.ArticleListDocument,
      variables: {
        filter: {
          tags: [tag]
        }
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
