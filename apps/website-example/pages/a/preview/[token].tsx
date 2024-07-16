import {ApiV1, ArticleContainer} from '@wepublish/website'
import {GetServerSideProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

export default function PreviewArticleByToken() {
  const {
    query: {token}
  } = useRouter()

  return <ArticleContainer token={token as string} />
}

export const getServerSideProps = (async ({params}) => {
  const {token} = params || {}
  const {publicRuntimeConfig} = getConfig()

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

  const [article] = await Promise.all([
    client.query({
      query: ApiV1.ArticleDocument,
      variables: {
        token
      }
    }),
    client.query({
      query: ApiV1.NavigationListDocument
    }),
    client.query({
      query: ApiV1.PeerProfileDocument
    })
  ])

  if (article.data && !article.data.article) {
    return {
      notFound: true
    }
  }

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {props}
}) satisfies GetServerSideProps
