import {ArticleWrapper} from '@wepublish/article/website'
import {CommentListContainer} from '@wepublish/comments/website'
import {
  addClientCacheToV1Props,
  CommentItemType,
  CommentListDocument,
  getV1ApiClient
} from '@wepublish/website/api'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {GetStaticPaths, GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

export function PeerArticleById() {
  const {
    query: {peerId, articleId}
  } = useRouter()

  const {
    elements: {H3}
  } = useWebsiteBuilder()

  return (
    <>
      <PeerArticleContainer peerId={peerId as string} articleId={articleId as string} />

      <ArticleWrapper>
        <H3 component={'h2'}>Kommentare</H3>

        <CommentListContainer
          id={articleId as string}
          type={CommentItemType.PeerArticle}
          peerId={peerId as string}
          signUpUrl="/mitmachen"
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

  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])
  await Promise.all([
    client.query({
      query: PeerArticleDocument,
      variables: {
        peerId,
        articleId
      }
    }),
    client.query({
      query: CommentListDocument,
      variables: {
        itemId: articleId
      }
    })
  ])

  const props = addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
