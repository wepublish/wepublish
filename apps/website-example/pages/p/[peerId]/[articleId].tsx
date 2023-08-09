import {
  ApiV1,
  ArticleWrapper,
  CommentListContainer,
  PeerArticleContainer,
  useWebsiteBuilder
} from '@wepublish/website'
import {GetStaticPaths, GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

export function PeerArticleById() {
  const {
    query: {peerId, articleId}
  } = useRouter()

  const {
    elements: {H5}
  } = useWebsiteBuilder()

  return (
    <>
      <PeerArticleContainer peerId={peerId as string} articleId={articleId as string} />

      <ArticleWrapper>
        <H5 component={'h2'}>Kommentare</H5>

        <CommentListContainer
          id={articleId as string}
          type={ApiV1.CommentItemType.PeerArticle}
          peerId={peerId as string}
        />
      </ArticleWrapper>
    </>
  )
}

export default PeerArticleById

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking'
  }
}

export const getStaticProps: GetStaticProps = async ({params}) => {
  const {peerId, articleId} = params || {}
  const {publicRuntimeConfig} = getConfig()

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])
  await Promise.all([
    client.query({
      query: ApiV1.PeerArticleDocument,
      variables: {
        peerId,
        articleId
      }
    }),
    client.query({
      query: ApiV1.CommentListDocument,
      variables: {
        itemId: articleId
      }
    })
  ])

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
