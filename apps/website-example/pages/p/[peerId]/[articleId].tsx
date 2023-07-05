import {PeerArticleContainer, ApiV1} from '@wepublish/website'
import {useRouter} from 'next/router'
import {GetStaticPaths, GetStaticProps} from 'next'
import getConfig from 'next/config'

export function ArticleById() {
  const {
    query: {peerId, articleId}
  } = useRouter()

  return (
    <>
      {peerId && articleId && (
        <PeerArticleContainer peerId={peerId as string} articleId={articleId as string} />
      )}
    </>
  )
}

export default ArticleById

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: true
  }
}

export const getStaticProps: GetStaticProps = async ({params}) => {
  const {peerId, articleId} = params || {}
  const {publicRuntimeConfig} = getConfig()

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])
  const data = await client.query({
    query: ApiV1.PeerArticleDocument,
    variables: {
      peerId,
      articleId
    }
  })

  return {
    props: {
      article: data?.data?.article
    },
    revalidate: 60 // every 60 seconds
  }
}
