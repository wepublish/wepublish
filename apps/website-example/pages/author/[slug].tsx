import {ApiV1, ArticleListContainer, AuthorContainer, useWebsiteBuilder} from '@wepublish/website'
import {GetStaticPaths, GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

export default function AuthorBySlug() {
  const {
    query: {slug}
  } = useRouter()
  const {
    elements: {H3}
  } = useWebsiteBuilder()

  const {data} = ApiV1.useAuthorQuery({
    fetchPolicy: 'cache-only',
    variables: {
      slug: slug as string
    }
  })

  return (
    <>
      <AuthorContainer slug={slug as string} />

      {data?.author && (
        <>
          <H3 component={'h2'}>Alle Artikel von {data.author.name}</H3>
          <ArticleListContainer variables={{filter: {authors: [data.author.id]}}} />
        </>
      )}
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
  const {slug} = params || {}
  const {publicRuntimeConfig} = getConfig()

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

  const data = await Promise.all([
    client.query({
      query: ApiV1.AuthorDocument,
      variables: {
        slug
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
